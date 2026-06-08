resource "google_artifact_registry_repository" "docker" {
  project       = var.project_id
  location      = var.region
  repository_id = local.service_name
  description   = "Docker repository for article-video-recommendation-service"
  format        = "DOCKER"

  depends_on = [
    google_project_service.required_apis,
  ]
}
