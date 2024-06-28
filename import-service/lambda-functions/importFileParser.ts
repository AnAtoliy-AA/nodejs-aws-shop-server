import * as AWS from "aws-sdk";
import * as csv from "csv-parser";
import { S3Event, S3Handler } from "aws-lambda";

const s3 = new AWS.S3();

const processRecord = (bucket: string, key: string) => {
  return new Promise<void>((resolve, reject) => {
    const params = {
      Bucket: bucket,
      Key: key,
    };

    console.log("params:", JSON.stringify(params, null, 2));

    const s3Stream = s3.getObject(params).createReadStream();

    s3Stream
      .pipe(csv())
      .on("data", (data) => {
        console.log("Record:", JSON.stringify(data));
      })
      .on("end", () => {
        console.log("CSV file successfully processed");
        resolve();
      })
      .on("error", (error) => {
        console.error("Error processing CSV file:", error);
        reject(error);
      });
  });
};

export const handler: S3Handler = async (event: S3Event) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  const promises = event.Records.map((record) => {
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;

    return processRecord(bucket, key);
  });

  try {
    await Promise.all(promises);
  } catch (error) {
    console.error("Error processing one or more CSV files:", error);
  }
};