# /bin/bash

# move report zip
echo "Searching for input reports"
cd /input/
zipfile=$(find -name "*.zip" -print -quit)
if [ -n "$zipfile" ]; then
    cp $zipfile /build/backend/report.zip
else
    # no input zip found, looking for report.json
    report_dir=$(find -name "report.json" -print -quit)
    if [ -z "$report_dir" ]; then
        echo $report_dir
        echo "No reports found in input directory."
        exit
    else
        echo "Directory found, packing it up"
        cd $(dirname $report_dir)
        zip -r -q /build/backend/report.zip *
    fi
fi
echo "Processing reports"
cd /build/
# start mongodb
mongod --dbpath /var/lib/mongodb --logpath /var/log/mongodb/mongod.log --fork
# node backend report processing
cd backend
npm run generate-report
# move generated file
rm /build/frontend/src/assets/static_report.json
cp static_report.json /build/frontend/src/assets/
# build static report
cd /build/frontend
npm run generate-report
# move to output
cp dist/static_report.html /output