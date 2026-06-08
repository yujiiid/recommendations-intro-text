variable "project_id" {
  description = "Google Cloud project ID."
  type        = string
}

variable "region" {
  description = "Google Cloud region for regional resources."
  type        = string
  default     = "europe-north1"
}

variable "image" {
  description = "Container image to use for the initial Cloud Run service skeleton. Deployment commands update this image later."
  type        = string
  default     = "gcr.io/cloudrun/hello"
}

variable "runtime_service_account_id" {
  description = "Account ID for the Cloud Run runtime service account."
  type        = string
  default     = "article-video-rec-run"
}

variable "cf_aig_token_secret_id" {
  description = "Secret Manager secret ID for the Cloudflare AI Gateway token. Terraform creates metadata only, not versions."
  type        = string
  default     = "cf-aig-token"
}
