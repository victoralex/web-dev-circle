# Cloud Zeitgeist
We wanted to build an automated way to process pictures into thumbnails, average screen size and conversion to a 3rd party format, using no programming code, but just Bash, command-line tools, and AWS. We've covered most of this excercise in the following manner:

# AWS
- an S3 (https://aws.amazon.com/s3/) bucket with an event attached to it on the uploads/ prefix, whenever a file is created, to send a message to an SNS (https://aws.amazon.com/sns/) topic
- an SNS topic with 3 SQS (https://aws.amazon.com/sqs/) queues linked to it, each for another image processing purpose
- for testing purposes, the same topic was sending emails to an address with the same notifications, just to have a real-time check without refreshing an interface or disturbing an SQS queue

# Bash
- since we didn't want to use any programming language, we've used the AWS CLI (https://aws.amazon.com/cli/) to query SQS
- we've used JQ (https://stedolan.github.io/jq/) to parse the queue data within SQS
- this was piped to AWS CLI again to download the file uploaded onto S3, for processing
- with ImageMagick (http://www.imagemagick.org/script/index.php) the file was resized and manipulated to add custom effects
- the resulting file was uploaded onto S3 under the processed/ prefix
- with AWS CLI the queued message was deleted

# Result

## Processing one uploaded file at a time and uploading the resulting file to S3
aws sqs receive-message --queue-url https://sqs.eu-central-1.amazonaws.com/601753120370/big-bucket-sqs --attribute-names All --message-attribute-names All --max-number-of-messages 10 \
| ./jq .Messages[0].Body \
| sed 's/\\n//g' | sed 's/\\"/\"/g' | sed 's/\"{/{/g' | sed 's/}\"/}/g' | sed 's/\\\\//g' \
| ` ./jq -r '"aws s3api get-object --bucket " + .Message.Records[0].s3.bucket.name + " --key " + .Message.Records[0].s3.object.key + " file.jpg "'` \
&& /opt/ImageMagick/bin/convert file.jpg -resize 750x750 fileResized3.jpg \
&& aws s3api put-object --bucket big-picture-bucket --key processed/file.jpg --body ./fileResized3.jpg 

## Removing the message from the queue
aws sqs delete-message --queue-url https://sqs.eu-central-1.amazonaws.com/601753120370/big-bucket-sqs --receipt-handle AQEBgaI2Nx9MsHLe6W5oNtvLqqG+kaPvKRCga7aNt4Gdqj8bK2+/o/yzaDzEAoOndhIhJInnya8uGQoNigzyIZ78fsJebXZBXy2D7zEWmSQCU08gJuba1wBd86JbeA95cl7zjsD5jzsmqO45JVI1YI50zL08zxR/SBex4V4+yzJHU9bUfKFByYL2v8IFA75GkbgaIgwtsvbmCkc9EF0x0+ZZvAN5b73UJP86YPNzz+cZqVALgJCdAuz+vUB1StRhYMRgMtfoTzPsT5RoIUqW7Nmg6YlfetOUPZ4SZGhQFuWQ+56j+jU8cOx2mqruquhzPytxfPFi6KY8Bhl2ZOEqlzfAi7GdX5zypW+Zuyikvzj7u7RX/W9Dn5vJovDhtD49FwDN3HqBtsOI/wPjKK8/76gJxQ==
