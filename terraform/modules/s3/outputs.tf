output "lesson_media_bucket_name" { value = aws_s3_bucket.lesson_media.id }
output "lesson_media_bucket_arn"  { value = aws_s3_bucket.lesson_media.arn }
output "pdf_exports_bucket_name"  { value = aws_s3_bucket.pdf_exports.id }
output "pdf_exports_bucket_arn"   { value = aws_s3_bucket.pdf_exports.arn }
