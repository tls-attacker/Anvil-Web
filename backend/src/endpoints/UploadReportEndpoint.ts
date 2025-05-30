import AdmZip from "adm-zip";
import { NextFunction, Request, Response, Router } from 'express';
import fileUpload from "express-fileupload";
import { Readable } from "stream";
import DB from '../database';
import mongoose from "mongoose";
import { BadRequest } from "../errors";


export namespace UploadReportEndpoint {

  export class Controller {
    private router: Router

    constructor(router: Router) {
      this.router = router
      router.post("/uploadReport", this.uploadReport)
    }

    private async uploadReport(req: Request, res: Response, next: NextFunction) {
      const file = req.files.report as fileUpload.UploadedFile
      const zipFile = new AdmZip(file.data)
      const summaryEntry = zipFile.getEntry("summary.json")
      const reportEntry = zipFile.getEntry("report.json")
      if (!summaryEntry && reportEntry) {
        await processNewReport(zipFile, res, next);
      } else if (!reportEntry && summaryEntry) {
        await processOldReport(zipFile, res, next);
      } else {
        return next(new BadRequest("No summary or report file found"));
        return
      }
    }
  }

  async function processOldReport(zipFile: AdmZip, res: Response, next: NextFunction) {
    // todo add backwards compatability
    const summaryEntry = zipFile.getEntry("summary.json")
    let summary = JSON.parse(summaryEntry.getData().toString())
    let exists = await DB.Report.findOne({ Identifier: summary.Identifier }, { Identifier: 1 }).lean().exec();
    if (exists != null) {
      return next(new BadRequest("Identifier already exists."))
    }
    summary.Date = new Date(summary.Date)
    summary.PartiallyFailedTests = 0;
    summary.FullyFailedTests = summary.FailedTests;
    summary.ConceptuallySucceededTests = 0;
    summary.StrictlySucceededTests = summary.SucceededTests;
    summary.TotalTests = summary.FailedTests + summary.SucceededTests + summary.DisabledTests;
    summary.FinishedTests = summary.TotalTests;
    let newscore = {
      Interoperability: summary.Score.INTEROPERABILITY.Percentage,
      Deprecated: summary.Score.DEPRECATED.Percentage,
      Messagestructure: summary.Score.MESSAGESTRUCTURE.Percentage,
      Recordlayer: summary.Score.RECORDLAYER.Percentage,
      Compliance: summary.Score.COMPLIANCE.Percentage,
      Security: summary.Score.SECURITY.Percentage,
      Alert: summary.Score.ALERT.Percentage,
      Crypto: summary.Score.CRYPTO.Percentage,
      CVE: summary.Score.CVE.Percentage,
      Certificate: summary.Score.CERTIFICATE.Percentage,
      Handshake: summary.Score.HANDSHAKE.Percentage
    }
    summary.Score = newscore;
    summary.TestCaseCount = summary.StatesCount;
    summary.Running = false;
    let report = new DB.Report(summary)
    await report.save()
    const entries = zipFile.getEntries()
    for (let entry of entries) {
      if (entry.entryName.endsWith("_containerResult.json")) {
        let containerResult = JSON.parse(entry.getData().toString())
        if (containerResult.States) { // backwards compatibillity
          containerResult.TestCases = containerResult.States;
          containerResult.CaseCount = containerResult.StatesCount;
          containerResult.TestClass = containerResult.TestMethod.ClassName;
          containerResult.TestMethod = containerResult.TestMethod.MethodName;
          containerResult.TestId = getTestIdForMethodName(containerResult.TestClass+"."+containerResult.TestMethod);
          for (let key in containerResult.Score) {
            let newKey = key[0] + key.toLowerCase().substr(1);
            containerResult.Score[newKey] = containerResult.Score[key].Percentage;
            delete containerResult.Score[key];
          }
          for (let i=0; i<containerResult.TestCases.length; i++) {
            containerResult.TestCases[i].ParameterCombination = containerResult.TestCases[i].DerivationContainer
          }
        }
        let testRun = new DB.TestRun(containerResult)
        testRun.ContainerId = report._id;
        testRun.save();
      }
    }

          res.send("OK")
    }
  
  export async function processNewReport(zipFile: AdmZip, res?: Response, next?: NextFunction) {
    // first, search for report file
    const reportEntry = zipFile.getEntry("report.json")
    let report = JSON.parse(reportEntry.getData().toString())
    let exists = await DB.Report.findOne({ Identifier: report.Identifier }, { Identifier: 1 }).lean().exec();
    if (exists != null) {
      if (next) {
        return next(new BadRequest("Identifier already exists"));
      } else {
        console.log("Database is not cleared! Reusing old report.");
        return;
      }
    }

    report = new DB.Report(report)
    // look fore guidelines
    const guidelines = zipFile.getEntry("guidelines.json");
    if (guidelines) {
      report.GuidelineReports = JSON.parse(guidelines.getData().toString())
    }
    // tls scanner report
    const tlsScannerReport = zipFile.getEntry("tls-scanner.txt");
    if (tlsScannerReport) {
      report.TlsScannerReport = tlsScannerReport.getData().toString();
    }
    // key log file
    const keylogfile = zipFile.getEntry("keyfile.log");
    if (keylogfile) {
      const uploadStream = DB.keylogfileBucket.openUploadStream("keyfile.log")
      const readableStream = new Readable()
      readableStream.push(keylogfile.getData())
      readableStream.push(null)
      readableStream.pipe(uploadStream)
      report.KeylogFile = uploadStream.id;
    }
    
    await report.save()

    // test runs
    const entries = zipFile.getEntries();
    for (let entry of entries) {
      if (entry.entryName.endsWith("_testRun.json")) {
        let testRun = JSON.parse(entry.getData().toString())
        if ("metadata" in testRun) {
          testRun["MetaData"] = testRun["metadata"];
        }
        testRun = new DB.TestRun(testRun)
        testRun.ContainerId = report._id
        // pcaps
        for (let testCase of testRun.TestCases) {
          let caseFile = entry.entryName.replace("_testRun.json", `dump_${testCase.uuid}.pcap`);
          let pcapEntry = zipFile.getEntry(caseFile);
          if (pcapEntry) {
            testCase.PcapData = pcapEntry.getData();
          }
        }
        testRun.save()
      }
    }

    if (res) {
      res.send("OK");
    }
  }

  const nameMap = {
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.Certificate.certificateMessageLengthTLS12": "XLF-7iivb12njd",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.Certificate.certificateListLengthTLS12": "XLF-eqZYAdwNye",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.Certificate.certificateMessageLengthTLS13": "XLF-uQXeugeUkb",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.Certificate.certificateListLengthTLS13": "XLF-ia3wstdqYe",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.Certificate.certificateRequestContextLength": "XLF-ujMXSAMmVF",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.CertificateVerify.certificateVerifyLength": "XLF-tSjRqK81S8",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.CertificateVerify.certificateVerifySignatureLength": "XLF-PkwVF7pRQa",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.ClientKeyExchange.clientKeyExchangeLength": "XLF-4iPUuT51YH",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.ClientKeyExchange.clientKeyExchangePublicKeyLength": "XLF-NFYNXBgXk8",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.EncryptedExtensions.encryptedExtensionsLength": "XLF-SA1CoksBgE",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.EncryptedExtensions.encryptedExtensionsExtensionsLength": "XLF-Ax6kVTgheY",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.Finished.finishedLengthTLS12": "XLF-CSQn3dUG9L",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.Finished.finishedLengthTLS13": "XLF-CALCiXbvRo",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.Hello.helloSessionIdLengthTLS12": "XLF-anjpbghN69",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.Hello.helloSessionIdLengthTLS13": "XLF-c4Db7ctU7V",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.Hello.helloLengthTLS12": "XLF-7AdFFavtAd",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.Hello.helloLengthTLS13": "XLF-RUoZsBa3n4",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.Hello.helloExtensionsLengthTLS12": "XLF-8NkdoEnnup",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.Hello.helloExtensionsLengthTLS13": "XLF-hjh8QDJmvK",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.Hello.clientHelloCipherSuitesLengthTLS12": "XLF-9XEqy2ZCoa",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.Hello.clientHelloCipherSuitesLengthTLS13": "XLF-rUWM4KWG2t",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.Hello.clientHelloCompressionLengthTLS12": "XLF-2BCMFwzm2j",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.Hello.clientHelloCompressionLengthTLS13": "XLF-pR3iFN7Miv",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.ServerKeyExchange.serverKeyExchangeLength": "XLF-Z5CqDTjvni",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.ServerKeyExchange.serverKeyExchangeSignatureLength": "XLF-gvZTTfnQTn",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.ServerKeyExchange.serverKeyExchangePublicKeyLength": "XLF-yiZVhouStn",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.ServerKeyExchange.modulusLength": "XLF-8852p34nEP",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.ServerKeyExchange.generatorLength": "XLF-DVpNzSiTq5",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.ALPNExtension.alpnExtensionLengthTLS12": "XLF-MNJikTAwVv",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.ALPNExtension.alpnProposedAlpnProtocolsLengthTLS12": "XLF-3D5DbZQNVB",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.ALPNExtension.alpnExtensionLengthTLS13": "XLF-yU3WPbhb9z",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.ALPNExtension.alpnProposedAlpnProtocolsLengthTLS13": "XLF-47Go2svX7H",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.ECPointFormatExtension.pointFormatExtensionLength": "XLF-mgWov7XYiw",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.ECPointFormatExtension.pointFormatExtensionFormatsLength": "XLF-XdYDypM7gN",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.EncryptThenMacExtension.encryptThenMacExtensionLengthTLS12": "XLF-p6RPJ7GabA",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.EncryptThenMacExtension.encryptThenMacExtensionLengthTLS13": "XLF-1y1FTzJRE5",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.ExtendedMasterSecretExtension.extendedMasterSecretExtensionLengthTLS12": "XLF-FjfCZ7g3ZD",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.ExtendedMasterSecretExtension.extendedMasterSecretExtensionLengthTLS13": "XLF-THGYQGHHdD",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.HeartbeatExtension.heartbeatExtensionLengthTLS12": "XLF-eouPKJt7Ht",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.HeartbeatExtension.heartbeatExtensionLengthTLS13": "XLF-dQABdv21Am",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.KeyShareExtension.keyShareExtensionLength": "XLF-YEP4C4ruSR",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.KeyShareExtension.keyShareEntryListLength": "XLF-kVXshRHqZy",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.PaddingExtension.paddingExtensionLengthTLS12": "XLF-thAfdtNTPh",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.PaddingExtension.paddingExtensionLengthTLS13": "XLF-a56v24NnM5",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.PreSharedKeyExtension.preSharedKeyExtensionLength": "XLF-XHw8giy6m4",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.PreSharedKeyExtension.preSharedKeyExtensionIdentityListLength": "XLF-kwNxe25ef8",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.PreSharedKeyExtension.preSharedKeyExtensionBinderListLength": "XLF-4L65zmLyuG",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.PSKKeyExchangeModesExtension.pskKeyExchangeModesExtensionLength": "XLF-NaN98M5Hqd",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.PSKKeyExchangeModesExtension.pskKeyExchangeModesExtensionListLength": "XLF-Nq22Dyhfzt",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.RenegotiationExtension.renegotiationExtensionLengthTLS12": "XLF-oU4NN7JA83",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.RenegotiationExtension.renegotiationExtensionLengthTLS13": "XLF-iqfnLSxRsR",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.RenegotiationExtension.renegotiationExtensionInfoLengthTLS12": "XLF-AxKvemiN6n",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.SignatureAndHashAlgorithmsExtension.signatureAndHashAlgorithmsExtensionLengthTLS12": "XLF-Dtq2iEmPmd",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.SignatureAndHashAlgorithmsExtension.signatureAndHashAlgorithmsExtensionLengthTLS13": "XLF-s6s3mWStow",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.SignatureAndHashAlgorithmsExtension.signatureAndHashAlgorithmsListLengthTLS12": "XLF-x666dC8D1Z",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.SignatureAndHashAlgorithmsExtension.signatureAndHashAlgorithmsListLengthTLS13": "XLF-Qm9jhF6Pn8",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.SupportedVersionsExtension.supportedVersionsExtensionLength": "XLF-9xtqzkYrTD",
    "de.rub.nds.tlstest.suite.tests.both.lengthfield.extensions.SupportedVersionsExtension.supportedVersionsListLength": "XLF-ATViZnuPw9",
    "de.rub.nds.tlstest.suite.tests.both.tls12.rfc5246.A5CipherSuite.negotiateTLS_NULL_WITH_NULL_NULL": "5246-eFjEfmd5DJ",
    "de.rub.nds.tlstest.suite.tests.both.tls12.rfc5246.A5CipherSuite.anonCipherSuites": "5246-Tc1PNh8yZh",
    "de.rub.nds.tlstest.suite.tests.both.tls12.rfc5246.AEADCiphers.invalidAuthTag": "5246-7JhgKXeTXv",
    "de.rub.nds.tlstest.suite.tests.both.tls12.rfc5246.AEADCiphers.invalidCiphertext": "5246-sYXZ8a3B4C",
    "de.rub.nds.tlstest.suite.tests.both.tls12.rfc5246.CBCBlockCipher.invalidCBCPadding": "5246-RNB9LX21i9",
    "de.rub.nds.tlstest.suite.tests.both.tls12.rfc5246.CBCBlockCipher.invalidCipherText": "5246-VC1baM1Mn1",
    "de.rub.nds.tlstest.suite.tests.both.tls12.rfc5246.CBCBlockCipher.invalidMAC": "5246-JBqS2uGywY",
    "de.rub.nds.tlstest.suite.tests.both.tls12.rfc5246.CBCBlockCipher.checkReceivedMac": "5246-BWb6uwVEte",
    "de.rub.nds.tlstest.suite.tests.both.tls12.rfc5246.ChangeCipherSpecProtocol.ccsContentTest": "5246-DFJ73jUtxK",
    "de.rub.nds.tlstest.suite.tests.both.tls12.rfc5246.CipherSuites.supportOfDeprecatedCipherSuites": "5246-jxPrq1MPSR",
    "de.rub.nds.tlstest.suite.tests.both.tls12.rfc5246.Finished.verifyFinishedMessageCorrect": "5246-mEQLrje2mh",
    "de.rub.nds.tlstest.suite.tests.both.tls12.rfc5246.Fragmentation.sendZeroLengthRecord_CCS": "5246-bXbN8uEo2c",
    "de.rub.nds.tlstest.suite.tests.both.tls12.rfc5246.Fragmentation.sendZeroLengthApplicationRecord": "5246-swjhCGVQMb",
    "de.rub.nds.tlstest.suite.tests.both.tls12.rfc5246.Fragmentation.sendEmptyApplicationRecord": "5246-q5y1zcoCCW",
    "de.rub.nds.tlstest.suite.tests.both.tls12.rfc5246.Fragmentation.sendEmptyFinishedRecord": "5246-5JmcCtfFY3",
    "de.rub.nds.tlstest.suite.tests.both.tls12.rfc5246.Fragmentation.sendRecordWithPlaintextOver2pow14": "5246-oqJiBwUXN8",
    "de.rub.nds.tlstest.suite.tests.both.tls12.rfc5246.Fragmentation.sendRecordWithCiphertextOver2pow14plus2048": "5246-6w2UjD5RGT",
    "de.rub.nds.tlstest.suite.tests.both.tls12.rfc5246.Fragmentation.recordFragmentationSupported": "5246-M5X6WTePcK",
    "de.rub.nds.tlstest.suite.tests.both.tls12.rfc5246.HappyFlow.happyFlow": "5246-jsdAL1vDy5",
    "de.rub.nds.tlstest.suite.tests.both.tls12.rfc6066.MaxFragmentLengthExtension.enforcesRecordLimit": "6066-XH6ZKSteMh",
    "de.rub.nds.tlstest.suite.tests.both.tls12.statemachine.ClientServerStateMachine.omitCCS": "XSM-azpktANa8c",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.AlertProtocol.treatsFatalAlertsAsFatalHandshake": "8446-VkKqN54gN1",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.AlertProtocol.treatsFatalAlertsAsFatalPostHandshake": "8446-k8Fht68Dq2",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.AlertProtocol.treatsUnknownWarningAlertsAsFatalHandshake": "8446-4vT4QZyhRd",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.AlertProtocol.treatsUnknownWarningAlertsAsFatalPostHandshake": "8446-Q8Xknkk2vi",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.AlertProtocol.treatsUnknownFatalAlertsAsFatalHandshake": "8446-zUe5jnQtoN",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.AlertProtocol.treatsUnknownFatalAlertsAsFatalPostHandshake": "8446-PDB3U8CTKu",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.AlertProtocol.sendsCloseNotify": "8446-V9hFSg6hoE",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.ComplianceRequirements.supportsAes128GcmSha256": "8446-nvo5NZdCUK",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.ComplianceRequirements.supportsSecp256r1": "8446-xhexdB876E",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.Finished.verifyFinishedMessageCorrect": "8446-dZhHUctEjQ",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.HappyFlow.happyFlow": "8446-jVohiUKi4u",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.KeyUpdate.sendKeyUpdateBeforeFinished": "8446-KAEXNq6tsi",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.KeyUpdate.sendUnknownRequestMode": "8446-Dy4H1oQ8bc",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.KeyUpdate.respondsWithValidKeyUpdate": "8446-J6tVdjJCzF",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.KeyUpdate.appDataUnderNewKeysSucceeds": "8446-fFh7mHrXow",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.RecordProtocol.invalidRecordContentType": "8446-vbFRZNusey",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.RecordProtocol.invalidRecordContentTypeAfterEncryption": "8446-PN89HSERKp",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.RecordProtocol.invalidAuthTag": "8446-GXAiyehrdF",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.RecordProtocol.sendRecordWithPlaintextOver2pow14": "8446-n1veCSRVjQ",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.RecordProtocol.invalidCiphertext": "8446-GNEMTQXXpq",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.RecordProtocol.acceptsOptionalPadding": "8446-i9pq4Yt8pz",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.RecordProtocol.sendRecordWithCiphertextOver2pow14plus256": "8446-BkyuGXzztX",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.RecordProtocol.sendEmptyRecord": "8446-aUT8tc8oYz",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.RecordProtocol.sendZeroLengthApplicationRecord": "8446-BSsVDoM82Z",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.RecordProtocol.sendEncryptedHandshakeRecordWithNoNonZeroOctet": "8446-EmE5eWBxE7",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.RecordProtocol.sendEncryptedAppRecordWithNoNonZeroOctet": "8446-hKUhsUFCnx",
    "de.rub.nds.tlstest.suite.tests.both.tls13.rfc8446.RecordProtocol.checkMinimumRecordProtocolVersions": "8446-V3SF3rXAAW",
    "de.rub.nds.tlstest.suite.tests.both.tls13.statemachine.ClientServerStateMachine.sendEmptyRecordFinished": "XSM-tGmYudnsgE",
    "de.rub.nds.tlstest.suite.tests.client.tls12.SupportedCiphersuites.supportsMoreCiphersuitesThanAdvertised": "5246-GFtKDMr9x7",
    "de.rub.nds.tlstest.suite.tests.client.tls12.SupportedCiphersuites.supportsLessCiphersuitesThanAdvertised": "5246-DZsWLPbTuc",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc5246.AlertProtocol.closeNotify": "5246-DjYR2JiJKn",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc5246.AlertProtocol.abortAfterFatalAlertServerHello": "5246-N8VwCXYaTF",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc5246.AlertProtocol.abortAfterFatalAlertServerHelloDone": "5246-rcBco3YXw8",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc5246.ClientCertificateMessage.clientMustSendCertMsg": "5246-JwYcazUHHv",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc5246.ClientHello.supportsNullCompressionMethod": "5246-kUgwh5Nkzn",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc5246.ClientHello.offersNonNullCompressionMethod": "5246-iAJbTqtHyt",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc5246.ClientHello.offeredSignatureAlgorithmsForAllCipherSuites": "5246-D6cXH2VnPy",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc5246.ClientHello.checkExtensions": "5246-booCra12We",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc5246.E1CompatibilityWithTLS10_11andSSL30.selectUnsupportedVersion": "5246-EMvcCVyKtv",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc5246.Fragmentation.sendZeroLengthRecord_SH": "5246-uMW2Qzjt88",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc5246.Fragmentation.sendHandshakeMessagesWithinSingleRecord": "5246-FsvDkXCwAy",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc5246.ServerHello.sendAdditionalExtension": "5246-YnrTYxwh4n",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc5246.ServerHello.selectUnproposedCompressionMethod": "5246-UXM2CG5DPA",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc5246.ServerKeyExchange.invalidServerKeyExchangeSignature": "5246-zqCFt52rqY",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc5246.ServerKeyExchange.acceptsUnproposedNamedGroup": "5246-wPU1BxUpeu",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc5246.ServerKeyExchange.acceptsUnproposedNamedGroupStatic": "5246-cNKtuNg3Lc",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc5246.ServerKeyExchange.acceptsMissingSignature": "5246-KAA9dJJg3h",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc5246.ServerKeyExchange.acceptsAnonSignatureForNonAnonymousCipherSuite": "5246-xTN7vXv2VU",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc5246.ServerKeyExchange.acceptsUnproposedSignatureAndHash": "5246-1Bsg5xe2cv",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc5246.TLSRecordProtocol.sendNotDefinedRecordTypesWithServerHello": "5246-AnX5PH2NS5",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc5246.TLSRecordProtocol.sendNotDefinedRecordTypesWithCCSAndFinished": "5246-Y2z3WpemKt",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc6066.MaximumFragmentLength.invalidMaximumFragmentLength": "6066-WpGEGtHscM",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc6066.MaximumFragmentLength.unrequestedMaximumFragmentLength": "6066-ossqki78mA",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc6066.MaximumFragmentLength.respectsNegotiatedMaxFragmentLength": "6066-XXJU5VtxbB",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc6066.ServerNameIndication.moreThanOneNameOfTheSameType": "6066-E12eJCyta7",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc6176.ProhibitingSSLv2.sendSSL2CompatibleClientHello": "6176-yZUPDLF21Z",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc6176.ProhibitingSSLv2.sendServerHelloVersionLower0300": "6176-GVZT3xHaGE",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc6176.ProhibitingSSLv2.testClientHelloProtocolVersion": "6176-1zkQSbX7Qy",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc7366.EncThenMacExtension.sendEncThenMacExtWithNonBlockCiphers": "7366-rCfTYbGUus",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc7366.EncThenMacExtension.encryptThenMacTest": "7366-2aUxJrnngy",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc7465.RC4Ciphersuites.offersRC4Ciphersuites": "7465-Het2o2vRcv",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc7465.RC4Ciphersuites.selectRC4CipherSuite": "7465-pUNK4mxZNB",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc7507.SCSV.doesNotIncludeFallbackCipherSuite": "7507-YMY8CHMEzt",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc7568.DoNotUseSSLVersion30.sendClientHelloVersion0300": "7568-BiD6J3KQPu",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc7685.PaddingExtension.paddingWithNonZero": "7685-9JJaftYtP3",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc7919.FfDheShare.shareOutOfBounds": "7919-vE2y2kZU5J",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc7919.FfDheShare.listsCurvesAndFfdheCorrectly": "7919-D3SJNRC99x",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc7919.FfDheShare.supportsOfferedFfdheGroup": "7919-ZZzQLMYM3L",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc7919.FfDheShare.performsRequiredSecurityCheck": "7919-64FAvRFA4A",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc8422.TLSExtensionForECC.invalidPointFormat": "8422-exVPmQoGGM",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc8422.TLSExtensionForECC.offeredDeprecatedGroup": "8422-zPzy3N3kzG",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc8422.TLSExtensionForECC.rejectsInvalidCurvePoints": "8422-A5SiH3AcVB",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc8422.TLSExtensionForECC.abortsWhenSharedSecretIsZero": "8422-nGxjfcCt1i",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc8422.TLSExtensionForECC.respectsPointFormat": "8422-DknikJ9VC5",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc8422.TLSExtensionForECC.offersExtensionsWithoutCipher": "8422-jJBYYpiKBH",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc8701.ServerInitiatedExtensionPoints.selectGreaseVersion": "8701-1yNET6C4bb",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc8701.ServerInitiatedExtensionPoints.selectGreaseCipherSuite": "8701-tEzdghyrj5",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc8701.ServerInitiatedExtensionPoints.sendServerHelloGreaseExtension": "8701-KSVZP6dF7j",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc8701.ServerInitiatedExtensionPoints.selectGreaseNamedGroup": "8701-Dct8jKkrvf",
    "de.rub.nds.tlstest.suite.tests.client.tls12.rfc8701.ServerInitiatedExtensionPoints.selectGreaseSignatureAlgorithm": "8701-1YAGJouHo8",
    "de.rub.nds.tlstest.suite.tests.client.tls12.statemachine.StateMachine.omitCertificate": "XSM-g5sZueNdGS",
    "de.rub.nds.tlstest.suite.tests.client.tls12.statemachine.StateMachine.omitChangeCipherSpecEncryptedFinished": "XSM-YWHyrAVFo3",
    "de.rub.nds.tlstest.suite.tests.client.tls12.statemachine.StateMachine.sendServerHelloTwice": "XSM-TPgoAceVQB",
    "de.rub.nds.tlstest.suite.tests.client.tls12.statemachine.StateMachine.sendSecondServerHelloAfterClientFinished": "XSM-jnFHuGoQR3",
    "de.rub.nds.tlstest.suite.tests.client.tls12.statemachine.StateMachine.sendResumptionMessageFlow": "XSM-SJ9mzNY9kZ",
    "de.rub.nds.tlstest.suite.tests.client.tls12.statemachine.StateMachine.beginWithFinished": "XSM-Rdcvemgd4h",
    "de.rub.nds.tlstest.suite.tests.client.tls12.statemachine.StateMachine.beginWithApplicationData": "XSM-Bv4mqPoKa4",
    "de.rub.nds.tlstest.suite.tests.client.tls13.SupportedCiphersuites.supportsMoreCipherSuitesThanAdvertised": "8446-FnJguFLqcc",
    "de.rub.nds.tlstest.suite.tests.client.tls13.SupportedCiphersuites.supportsLessCipherSuitesThanAdvertised": "8446-CFyJvy1SNZ",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.Certificate.emptyCertificateMessage": "8446-vN4oMaYkC6",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.Certificate.emptyCertificateList": "8446-cM4fvnBMce",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.CertificateVerify.selectLegacyRSASignatureAlgorithm": "8446-oN7MGas4sq",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.CertificateVerify.selectLegacyECDSASignatureAlgorithm": "8446-LNoEKntfip",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.CertificateVerify.invalidSignature": "8446-cEg5hNM3Lm",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.CertificateVerify.acceptsUnproposedSignatureAndHash": "8446-NYgNsg97bX",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.CertificateVerify.emptySignature": "8446-HKxd74FVbC",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.CertificateVerify.emptySigAlgorithm": "8446-CZWhi6PJvQ",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.CertificateVerify.emptyBoth": "8446-AptaW3C62X",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.ClientAuthentication.clientSendsCertificateAndFinMessage": "8446-bejcyb2cLf",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.ClientHello.checkLegacyVersion": "8446-Agnoga6SCd",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.ClientHello.checkExtensionsValidity": "8446-eMuKxJmUfq",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.ClientHello.checkMandatoryExtensions": "8446-u9JfnwgsWH",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.ClientHello.checkLegacySessionId": "8446-Q2RbRWjAdJ",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.Cookie.clientHelloContainsCookieExtension": "8446-C9aFBzrCbX",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.EncryptedExtensions.sendSupportedVersionsExtensionInEE": "8446-X68SWFRBVS",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.EncryptedExtensions.sendPaddingExtensionInEE": "8446-U5uSdqYohP",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.EncryptedExtensions.invalidMaximumFragmentLength": "8446-34CYsV98Fs",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.EncryptedExtensions.unrequestedMaximumFragmentLength": "8446-XDu7chdPTM",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.Extensions.sendAdditionalExtension": "8446-guYpWN18yk",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.Extensions.sendHeartBeatExtensionInSH": "8446-6dvAUhLdUW",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.HelloRetryRequest.helloRetryRequestsUnofferedGroup": "8446-2L9AK4xSva",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.HelloRetryRequest.helloRetryRequestsUnofferedTls13CipherSuite": "8446-bfziReZMw4",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.HelloRetryRequest.helloRetryRequestResultsInNoChanges": "8446-s2k4bG3Gz9",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.HelloRetryRequest.sendSecondHelloRetryRequest": "8446-FviCUju7gw",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.HelloRetryRequest.cipherSuiteDisparity": "8446-f3pZavKkyP",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.HelloRetryRequest.namedGroupDisparity": "8446-KLkH56oYzC",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.HelloRetryRequest.versionDisparity": "8446-ncR52WSgGx",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.HelloRetryRequest.helloRetryLegacySessionId": "8446-6X9hLRk9V4",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.HelloRetryRequest.helloRetryCompressionValue": "8446-dyTnCEsFo1",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.HelloRetryRequest.helloRetryGreaseCipherSuite": "8446-qN6nNMX9Sx",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.HelloRetryRequest.helloRetryGreaseExtension": "8446-TyCkZKkVMt",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.HelloRetryRequest.helloRetryGreaseVersionSelected": "8446-vU6BQin9Eo",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.HelloRetryRequest.actsCorrectlyUponHelloRetryRequest": "8446-5NRGuXE3Em",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.HelloRetryRequest.helloRetryRequestsTls12CipherSuite": "8446-7byKPGEA8Q",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.HelloRetryRequest.copiesCookieValue": "8446-2v6S87AwgY",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.KeyShare.testOrderOfKeyshareEntries": "8446-WtTcgsZFA3",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.KeyShare.selectInvalidKeyshare": "8446-F9bWYMiB45",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.KeyShare.rejectsPointsNotOnCurve": "8446-YMYRto48Jg",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.KeyShare.abortsWhenSharedSecretIsZero": "8446-h4RyAhoVZy",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.KeyShare.offeredDeprecatedGroups": "8446-JKvCjP5mKE",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.KeyShare.ffdheShareOutOfBounds": "8446-QxfMDM9cBK",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.NewSessionTicket.ignoresUnknownNewSessionTicketExtension": "8446-b7XLVJA8Pn",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.PreSharedKey.isLastExtension": "8446-v48HMDRHVT",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.PreSharedKeyExchangeModes.sendPSKModeExtension": "8446-t4AtKzmU9J",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.RecordLayer.zeroLengthRecord_ServerHello": "8446-i8hwrTotPM",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.RecordLayer.zeroLengthRecord_Finished": "8446-2R6GNvoUEs",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.RecordLayer.interleaveRecords": "8446-BbKKCCtSdd",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.RecordLayer.sendEmptyZeroLengthRecords": "8446-m6iEnsoJCw",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.RecordLayer.incompleteCertVerifyBeforeFinished": "8446-VNQgpDNZVS",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.ServerHello.testSessionId": "8446-zgsrCx4EDP",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.ServerHello.testCipherSuite": "8446-2yeDE1Bso6",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.ServerHello.testCompressionValue": "8446-oEdBWdqUnm",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.ServerHello.testRandomDowngradeValue": "8446-TyxxKdqwv3",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.SignatureAlgorithms.acceptsMixedCurveHashLengthInTls12": "8446-qibaoRRFDr",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.SignatureAlgorithms.supportsRsaPssInTls12": "8446-qNaBPZ4ofA",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.SignatureAlgorithms.noDeprecatedAlgorithmsOffered": "8446-5E3CVBTFdt",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.SupportedVersions.invalidLegacyVersion": "8446-oysw9PbeiT",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.SupportedVersions.selectOlderTlsVersionInTls12": "8446-w9k9gMLaeU",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.SupportedVersions.selectOlderTlsVersion": "8446-YDjQAqZ2LM",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.SupportedVersions.supportedVersionContainsTls13": "8446-o5uxfywWFS",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.SupportedVersions.negotiateUnproposedOldProtocolVersion": "8446-cck1BzgJ1h",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8446.SupportedVersions.legacyNegotiateUndefinedProtocolVersion": "8446-eNP4DYhWjk",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8701.ServerInitiatedExtensionPoints.advertiseGreaseExtensionsInSessionTicket": "8701-91tcbyhyNk",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8701.ServerInitiatedExtensionPoints.selectGreaseVersion": "8701-q8vvYUsUCu",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8701.ServerInitiatedExtensionPoints.selectGreaseCipherSuite": "8701-xwVd59Y3Fq",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8701.ServerInitiatedExtensionPoints.sendServerHelloGreaseExtension": "8701-NczJT3TSj4",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8701.ServerInitiatedExtensionPoints.sendEncryptedExtensionsGreaseExtension": "8701-pVCWxJraM8",
    "de.rub.nds.tlstest.suite.tests.client.tls13.rfc8701.ServerInitiatedExtensionPoints.sendCertificateVerifyGreaseSignatureAlgorithm": "8701-9F3St2di12",
    "de.rub.nds.tlstest.suite.tests.client.tls13.statemachine.StateMachine.sendFinishedWithoutCert": "XSM-LdxAqeL2Te",
    "de.rub.nds.tlstest.suite.tests.client.tls13.statemachine.StateMachine.sendHandshakeTrafficSecretEncryptedChangeCipherSpec": "XSM-2iKDTUhXF5",
    "de.rub.nds.tlstest.suite.tests.client.tls13.statemachine.StateMachine.sendAppTrafficSecretEncryptedChangeCipherSpec": "XSM-Xb6pAYY3fT",
    "de.rub.nds.tlstest.suite.tests.client.tls13.statemachine.StateMachine.sendLegacyChangeCipherSpecAfterFinished": "XSM-sHFfpjZxQh",
    "de.rub.nds.tlstest.suite.tests.client.tls13.statemachine.StateMachine.sendLegacyFlowCertificate": "XSM-gN2Mz9wD2D",
    "de.rub.nds.tlstest.suite.tests.client.tls13.statemachine.StateMachine.sendLegacyFlowECDHEKeyExchange": "XSM-aWBzNYEKwz",
    "de.rub.nds.tlstest.suite.tests.client.tls13.statemachine.StateMachine.sendLegacyFlowDHEKeyExchange": "XSM-F8VTZ3optN",
    "de.rub.nds.tlstest.suite.tests.client.tls13.statemachine.StateMachine.beginWithApplicationData": "XSM-iTKLQBFN9A",
    "de.rub.nds.tlstest.suite.tests.client.tls13.statemachine.StateMachine.beginWithFinished": "XSM-TQQj27kntr",
    "de.rub.nds.tlstest.suite.tests.client.tls13.statemachine.StateMachine.sendServerHelloTwice": "XSM-FLPgMqSvg9",
    "de.rub.nds.tlstest.suite.tests.client.tls13.statemachine.StateMachine.sendEndOfEarlyDataAsServer": "XSM-LrxDfiLZM5",
    "de.rub.nds.tlstest.suite.tests.client.tls13.statemachine.StateMachine.omitCertificateVerify": "XSM-gN61eQrmNv",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.AlertProtocol.closeNotify": "5246-ANzf57gCyp",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.AlertProtocol.abortAfterFatalAlert_sendBeforeCCS": "5246-fGCWkS7TDf",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.AlertProtocol.abortAfterFatalAlert_sendAfterServerHelloDone": "5246-hD2QPXyAHw",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.CertificateVerify.invalidCertificateVerify": "5246-ZTQ27ZY8s8",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.ClientHello.unknownCipherSuite": "5246-ST5MN96BuF",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.ClientHello.unknownCompressionMethod": "5246-P4AGQWTZsM",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.ClientHello.includeUnknownExtension": "5246-YhZ7GJjrwk",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.ClientHello.offerManyCipherSuites": "5246-RMehEjs346",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.ClientHello.leaveOutExtensions": "5246-LtPf1AMt7Y",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.E1CompatibilityWithTLS10_11andSSL30.versionGreaterThanSupportedByServer": "5246-1dbRcCn9si",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.E1CompatibilityWithTLS10_11andSSL30.versionLowerThanSupportedByServer": "5246-cBgzhL56ow",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.E1CompatibilityWithTLS10_11andSSL30.acceptAnyRecordVersionNumber": "5246-YLok6XJr7R",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.Fragmentation.sendZeroLengthRecord_CH": "5246-J6zSpKaaXP",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.Fragmentation.sendZeroLengthRecord_Alert": "5246-2FWjWfzv3Q",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.Fragmentation.sendHandshakeMessagesWithinMultipleRecords_CKE_CCS_F": "5246-yNEWNcjFZF",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.Fragmentation.sendHandshakeMessagesWithinMultipleRecords_CKE_CCSF": "5246-RNQeBZXVNc",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.Resumption.rejectSniDisparityResumption": "5246-Zs3yXnQzh6",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.Resumption.serverHelloSniInResumption": "5246-JmGqP73yfy",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.Resumption.rejectResumptionAfterFatalPostHandshake": "5246-5svSoN3NYm",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.Resumption.rejectResumptionAfterInvalidFinished": "5246-qXpKD7cBiC",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.RSAEncryptedPremasterSecretMessage.PMWithWrongClientVersion": "5246-VfW71fZRBF",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.RSAEncryptedPremasterSecretMessage.PMWithWrongPKCS1Padding": "5246-jnNzxCinX4",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.ServerHello.serverRandom": "5246-rjHUSd1Lnf",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.ServerHello.checkExtensions": "5246-yM4KkM8m6m",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.ServerKeyExchange.signatureIsValid": "5246-nZ7mATYszU",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.SignatureAlgorithms.dssNoSignatureAlgorithmsExtension": "5246-ZdnCWL4k5G",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.SignatureAlgorithms.ecdsaNoSignatureAlgorithmsExtension": "5246-MjFVuYUzfF",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.SignatureAlgorithms.includeUnknownSignatureAndHashAlgorithm": "5246-gnRCzTtN6q",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.SignatureAlgorithms.offerManyAlgorithms": "5246-52fQFPB85j",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.TLSRecordProtocol.sendNotDefinedRecordTypesWithClientHello": "5246-E35jpNkWHS",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc5246.TLSRecordProtocol.sendNotDefinedRecordTypesWithCCSAndFinished": "5246-J3JUrjX6Xa",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc6066.CertificateStatusRequest.doesNotSendUnrequestedCertificateStatus": "6066-JyjogiVdHS",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc6066.MaximumFragmentLength.invalidMaximumFragmentLength": "6066-39keM8ZKdL",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc6066.MaximumFragmentLength.respectsNegotiatedMaxFragmentLength": "6066-UYvTvBM1mm",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc6066.ServerNameIndication.moreThanOneNameOfTheSameType": "6066-R1bTAhZhmS",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc6176.ProhibitingSSLv2.sendSSL2CompatibleClientHello": "6176-KmcHZWR21g",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc6176.ProhibitingSSLv2.sendClientHelloVersionLower0300": "6176-UvTTXNibXJ",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc7366.EncThenMacExtension.negotiatesEncThenMacExt": "7366-rFjsKGrqCe",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc7366.EncThenMacExtension.negotiatesEncThenMacExtOnlyWithBlockCiphers": "7366-HSEGiXELMF",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc7465.RC4Ciphersuites.offerRC4AndOtherCiphers": "7465-Wgqu8SjgSW",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc7465.RC4Ciphersuites.onlyRC4Suites": "7465-YNsMZJY6pa",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc7507.SCSV.includeFallbackSCSV": "7507-vRFeTtQWZU",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc7507.SCSV.includeFallbackSCSV_nonRecommendedCipherSuiteOrder": "7507-tdAiQecjfD",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc7568.DoNotUseSSLVersion30.sendClientHelloVersion0300": "7568-SxJGaYDNfG",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc7568.DoNotUseSSLVersion30.sendClientHelloVersion0300DifferentRecordVersion": "7568-4aw1KUVQi9",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc7568.DoNotUseSSLVersion30.sendClientHelloVersion0300RecordVersion": "7568-6CdJpT15w2",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc7685.PaddingExtension.paddingWithNonZero": "7685-gMPk6BA96F",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc7685.PaddingExtension.serverDoesNotEcho": "7685-mCUrK3JRDo",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc7919.FfDheShare.shareOutOfBounds": "7919-1GQ8w3rdqd",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc7919.FfDheShare.negotiatesNonFfdheIfNecessary": "7919-pPnKVL1dfj",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc7919.FfDheShare.abortsWhenGroupsDontOverlap": "7919-5qMeS9hJ7K",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc7919.FfDheShare.respectsOfferedGroups": "7919-poUc9K3yfd",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc7919.FfDheShare.doesNotNegotiateDheCipherSuiteWhenNotOffered": "7919-stXkxYBEVU",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc8422.PointFormatExtension.serverAdvertisesOnlyUncompressedPointFormat": "8422-cxTqTQ7WwQ",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc8422.PointFormatExtension.invalidPointFormat": "8422-hCNJHtPUAY",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc8422.PointFormatExtension.deprecatedFormat": "8422-DRMPmFHPDy",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc8422.RespectClientExtensions.respectChosenCurve": "8422-zuAGxqyDEg",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc8422.RespectClientExtensions.respectChosenCurveWithoutFormats": "8422-bc43G6qpcS",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc8422.RespectClientExtensions.respectsChosenCurveForCertificates": "8422-xyn7SDVFRX",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc8422.TLSExtensionForECC.addUnknownEllipticCurve": "8422-rxF7z2tc5t",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc8422.TLSExtensionForECC.onlyInvalidEllipticCurve": "8422-Dk77D7HNBW",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc8422.TLSExtensionForECC.invalidEllipticCurve_WithNonECCCiphersuite": "8422-4G8mbkQ9LM",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc8422.TLSExtensionForECC.supportsDeprecated": "8422-ErkUw4SDEy",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc8422.TLSExtensionForECC.manyGroupsOffered": "8422-PtimgKWxss",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc8422.TLSExtensionForECC.rejectsInvalidCurvePoints": "8422-4MTo5xU82i",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc8422.TLSExtensionForECC.abortsWhenSharedSecretIsZero": "8422-fV4R6XHPeJ",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc8422.TLSExtensionForECC.leavesPublicKeyUnsignedInAnon": "8422-ymcrNp3RQw",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc8701.ClientInitiatedExtensionPoints.advertiseGreaseCiphersuites": "8701-E4jT9RDD5y",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc8701.ClientInitiatedExtensionPoints.advertiseGreaseExtensions": "8701-7DCDj6NnBm",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc8701.ClientInitiatedExtensionPoints.advertiseGreaseNamedGroup": "8701-BAMcGFuNFr",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc8701.ClientInitiatedExtensionPoints.advertiseGreaseSignatureAlgorithms": "8701-ngetVmJySH",
    "de.rub.nds.tlstest.suite.tests.server.tls12.rfc8701.ClientInitiatedExtensionPoints.advertiseGreaseALPNIdentifiers": "8701-SCkMwRniGX",
    "de.rub.nds.tlstest.suite.tests.server.tls12.statemachine.StateMachine.sendHeartbeatRequestAfterClientHello": "XSM-N5VTen5U6e",
    "de.rub.nds.tlstest.suite.tests.server.tls12.statemachine.StateMachine.sendHeartbeatRequestAfterClientKeyExchange": "XSM-hUmvB1guzB",
    "de.rub.nds.tlstest.suite.tests.server.tls12.statemachine.StateMachine.sendHeartbeatRequestAfterChangeCipherSpec": "XSM-RGwxgMCeT9",
    "de.rub.nds.tlstest.suite.tests.server.tls12.statemachine.StateMachine.secondClientHelloAfterClientKeyExchange": "XSM-JoVdmVr5by",
    "de.rub.nds.tlstest.suite.tests.server.tls12.statemachine.StateMachine.sendFinishedAfterServerHello": "XSM-uscvmqxrG3",
    "de.rub.nds.tlstest.suite.tests.server.tls12.statemachine.StateMachine.beginWithFinished": "XSM-hV8iCuJCXT",
    "de.rub.nds.tlstest.suite.tests.server.tls12.statemachine.StateMachine.secondClientKeyExchange": "XSM-zmpmr7nVki",
    "de.rub.nds.tlstest.suite.tests.server.tls12.statemachine.StateMachine.secondClientKeyExchangeDifferentAction": "XSM-7HDSP4DS95",
    "de.rub.nds.tlstest.suite.tests.server.tls12.statemachine.StateMachine.secondClientKeyExchangeAfterChangeCipherSpec": "XSM-RPJWoZQFc5",
    "de.rub.nds.tlstest.suite.tests.server.tls12.statemachine.StateMachine.secondClientKeyExchangeAfterChangeCipherSpecUnencrypted": "XSM-9TgGnWGw1S",
    "de.rub.nds.tlstest.suite.tests.server.tls12.statemachine.StateMachine.beginWithChangeCipherSpec": "XSM-1yXVP5Gbsr",
    "de.rub.nds.tlstest.suite.tests.server.tls12.statemachine.StateMachine.beginWithEmptyApplicationData": "XSM-Lz5fCfdmQi",
    "de.rub.nds.tlstest.suite.tests.server.tls12.statemachine.StateMachine.beginWithApplicationData": "XSM-tVGt2rqQy1",
    "de.rub.nds.tlstest.suite.tests.server.tls12.statemachine.StateMachine.secondChangeCipherSpecAfterHandshake": "XSM-jQ4aV9UCUM",
    "de.rub.nds.tlstest.suite.tests.server.tls12.statemachine.StateMachine.secondChangeCipherSpecAfterHandshakeUnencrypted": "XSM-WzfTB6GdUF",
    "de.rub.nds.tlstest.suite.tests.server.tls12.statemachine.StateMachine.secondClientHelloAfterServerHello": "XSM-mnyxwyTTK2",
    "de.rub.nds.tlstest.suite.tests.server.tls12.statemachine.StateMachine.secondClientHello": "XSM-xDPE4XDweY",
    "de.rub.nds.tlstest.suite.tests.server.tls12.statemachine.StateMachine.earlyChangeCipherSpec": "XSM-dV8FPhVnww",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.Certificate.certificateListIsNotEmpty": "8446-d9fcJKjSny",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.CertificateVerify.signatureIsValid": "8446-qfG8mSV78A",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.ClientHello.includeUnknownCipherSuite": "8446-Ruhj2eLN2t",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.ClientHello.invalidLegacyVersion_higher": "8446-B41SD1Cnr6",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.ClientHello.invalidLegacyVersion_lower": "8446-fsDXt1hint",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.ClientHello.invalidLegacyVersion_ssl30": "8446-hsFoi24Gdh",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.ClientHello.invalidCompression": "8446-qgJEM4UoBe",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.ClientHello.includeUnknownExtension": "8446-vtJcLUKtNv",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.ClientHello.omitKeyShareAndSupportedGroups": "8446-GZpjQTKUD4",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.ClientHello.omitKeyShare": "8446-jEEunwNUJ3",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.ClientHello.omitSupportedGroups": "8446-KQn4u3Xj4M",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.ClientHello.acceptsCompressionListForLegacyClient": "8446-Uqrk3dnMz7",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.Cookie.clientHelloWithUnsolicitedCookieExtension": "8446-i1e2R9UFD2",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.CryptographicNegotiation.noOverlappingParameters": "8446-5fMfqyHu68",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.CryptographicNegotiation.noOverlappingParametersCipherSuite": "8446-QxURSJAYJj",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.EarlyData.selectedFirstIdentity": "8446-3tUPL8K9nh",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.EarlyData.cipherSuiteDisparity": "8446-QX4UnMXsbP",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.EarlyData.tlsVersionDisparity": "8446-wiNRa3novJ",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.EarlyData.invalidCiphertext": "8446-LSEXdVf1sN",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.EarlyData.invalidAuthTag": "8446-QSom3GGTZ1",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.EncryptedExtensions.includedInvalidExtensions": "8446-ZkFrZYKzbi",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.HelloRetryRequest.helloRetryRequestValid": "8446-7STiGzfK9u",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.HelloRetryRequest.selectsSameCipherSuiteAllAtOnce": "8446-aVxixR6JLE",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.HelloRetryRequest.selectsSameCipherSuite": "8446-PqtPy7dAY2",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.HelloRetryRequest.retainsProtocolVersion": "8446-i5qA9bNwto",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.HelloRetryRequest.sentHelloRetryRequest": "8446-FwJUHPJFYr",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.KeyShare.testOrderOfKeyshareEntries": "8446-9hMnjrCbMV",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.KeyShare.serverOnlyOffersOneKeyshare": "8446-R2rb1WZoQo",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.KeyShare.serverOnlyOffersOneKeyshareAllGroupsAtOnce": "8446-TKn1mNn5mY",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.KeyShare.serverAcceptsDeprecatedGroups": "8446-KdkvUJX3HK",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.KeyShare.serverAcceptsDeprecatedGroupsAllAtOnce": "8446-1vps8J91dU",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.KeyShare.includeUnknownGroup": "8446-tCzswEB5Ua",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.KeyShare.rejectsPointsNotOnCurve": "8446-Pew9n1pYvc",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.KeyShare.ffdheShareOutOfBounds": "8446-5Vqv9qrKQQ",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.KeyShare.abortsWhenSharedSecretIsZero": "8446-sa4RjSVVNr",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.MiddleboxCompatibility.respectsClientCompatibilityWish": "8446-bgegNHeUgg",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.MiddleboxCompatibility.respectsClientCompatibilityWishWithHrr": "8446-vUL6yuqsbj",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.NewSessionTicket.newSessionTicketsAreValid": "8446-Av3GbEztrR",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.PreSharedKey.isNotLastExtension": "8446-8RhYHEGBvv",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.PreSharedKey.isLastButDuplicatedExtension": "8446-K5PYwUqs8E",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.PreSharedKey.respectsKeyExchangeChoicePskOnly": "8446-Hq5yKcFcmQ",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.PreSharedKey.respectsKeyExchangeChoicePskDhe": "8446-Eqo9cmGAET",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.PreSharedKey.invalidBinder": "8446-AGtoN1G2B3",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.PreSharedKey.noBinder": "8446-1SEHo5n8WM",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.PreSharedKey.selectedPSKIndexIsWithinOfferedListSize": "8446-2eQTsmq7d1",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.PreSharedKey.resumeWithCipherWithDifferentHkdfHash": "8446-Yo68xBhELu",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.PreSharedKey.sendPskExtensionWithoutPskKeyExchangeModes": "8446-mwDQtBNg4o",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.RecordLayer.zeroLengthRecord_CH": "8446-HWUJWNwjoA",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.RecordLayer.zeroLengthRecord_Finished": "8446-orNs8sPcM8",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.RecordLayer.interleaveRecords": "8446-EHgkL2huNs",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.RecordLayer.ignoresInitialRecordVersion": "8446-UCLQ6PhSyy",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.RecordLayer.checkRecordProtocolVersion": "8446-qrenZekKeD",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.ServerHello.testLegacyVersion": "8446-8bcX8V9Zve",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.ServerHello.testServerRandomFor12": "8446-p17y8QGnbD",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.ServerHello.testServerRandomFor11": "8446-CyEBbGYnB5",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.ServerHello.testServerRandomFor10": "8446-h8ESe4vrN3",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.ServerHello.testSessionIdEchoed": "8446-3FhkMFZvbt",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.ServerHello.testShortSessionIdEchoed": "8446-aDiNwQZBTY",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.ServerHello.testCompressionValue": "8446-S1VjZrpD1J",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.ServerHello.testProvidedExtensions": "8446-sm3XxXFjbr",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.SignatureAlgorithms.omitSignatureAlgorithmsExtension": "8446-kAJgkp7NBf",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.SignatureAlgorithms.offerLegacySignatureAlgorithms": "8446-gKTTeCxk6m",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.SignatureAlgorithms.offerOnlyLegacySignatureAlgorithms": "8446-3WqNtgoV2Z",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.SignatureAlgorithms.includeUnknownSignatureAndHashAlgorithm": "8446-5YCxveMdpt",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.SupportedVersions.testVersionPreferrence": "8446-UwCnJTWbmd",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.SupportedVersions.omitSupportedVersionsExtension": "8446-ZiLwhbnp3y",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.SupportedVersions.supportedVersionsAbsentOnlyUnsupportedLegacyVersion": "8446-zCaAr5BmNR",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.SupportedVersions.oldLegacyVersion": "8446-ihyps8KzBF",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.SupportedVersions.unknownVersion": "8446-LoyBdjVUeE",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.SupportedVersions.supportedVersionsWithoutTls13": "8446-vdaMcxzYj2",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.SupportedVersions.tls13Handshake": "8446-n5pojEqeaS",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.SupportedVersions.setLegacyVersionTo0304": "8446-2NRWKXH1nX",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8446.SupportedVersions.setLegacyVersionTo0304WithoutSVExt": "8446-WKMbKXKLH1",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8701.ClientInitiatedExtensionPoints.advertiseGreaseCiphersuites": "8701-iaW1cm19MU",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8701.ClientInitiatedExtensionPoints.advertiseGreaseExtensions": "8701-PErDdQZt7u",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8701.ClientInitiatedExtensionPoints.advertiseGreaseNamedGroup": "8701-2XMSQq7p9T",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8701.ClientInitiatedExtensionPoints.advertiseGreaseSignatureAlgorithms": "8701-ek86W17BUz",
    "de.rub.nds.tlstest.suite.tests.server.tls13.rfc8701.ClientInitiatedExtensionPoints.advertiseGreaseALPNIdentifiers": "8701-fe7Ev3bbiq",
    "de.rub.nds.tlstest.suite.tests.server.tls13.statemachine.StateMachine.secondClientHello": "XSM-FeqjZ8aw4M",
    "de.rub.nds.tlstest.suite.tests.server.tls13.statemachine.StateMachine.beginWithApplicationData": "XSM-h4swiGTUoj",
    "de.rub.nds.tlstest.suite.tests.server.tls13.statemachine.StateMachine.beginWithFinished": "XSM-ttrqZTyAR7",
    "de.rub.nds.tlstest.suite.tests.server.tls13.statemachine.StateMachine.sendLegacyChangeCipherSpecAfterFinished": "XSM-suejNj5yGF",
    "de.rub.nds.tlstest.suite.tests.server.tls13.statemachine.StateMachine.sendEncryptedChangeCipherSpec": "XSM-XKTmaWjbUn",
    "de.rub.nds.tlstest.suite.tests.server.tls13.statemachine.StateMachine.sendLegacyFlowECDHClientKeyExchange": "XSM-nRMHLnST86",
    "de.rub.nds.tlstest.suite.tests.server.tls13.statemachine.StateMachine.sendLegacyFlowDHClientKeyExchange": "XSM-fiTPAjuY4v",
    "de.rub.nds.tlstest.suite.tests.server.tls13.statemachine.StateMachine.sendLegacyFlowRSAClientKeyExchange": "XSM-jGhG25V2Jy",
    "de.rub.nds.tlstest.suite.tests.server.tls13.statemachine.StateMachine.sendClientHelloAfterFinishedHandshake": "XSM-Q5G5Vrenab",
  } as {[key: string]: string}

  function getTestIdForMethodName(methodName: string): string {
    return nameMap[methodName];
  }
}

