terraform {
  backend "gcs" {
    bucket = "ai-video-rec-stage-terraform-state"
    prefix = "article-video-recommendation-service/stage"
  }
}
