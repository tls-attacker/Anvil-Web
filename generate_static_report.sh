# /bin/bash

# move report zip
echo "Searching for input reports"
if test -f "/input/*.zip"; then
    cp /input/*.zip report.zip
else
    # no input zip found, looking for report.json
    cd /input/
    report_dir=$(find -name "report.json" -print -quit)
    if [ -z "$report_dir" ]; then
        echo $report_dir
        echo "No reports found in input directory."
        exit
    else
        cd $(dirname $report_dir)
        zip -r -q /build/report.zip *
        cd /build/
    fi
fi
echo "Processing reports"
# start mongodb
mongod --dbpath /var/lib/mongodb --logpath /var/log/mongodb/mongod.log --fork
# node backend report processing
cd backend
npm run generate-report
# move generated file
cp static_report.json ../frontend/src/assets/
# build static report
cd ../frontend
npm run generate-report
# move to output
cp dist/static_report.html /output