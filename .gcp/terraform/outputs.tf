output "cloud_run_service_url" {
  description = "Cloud Run service URL."
  value       = google_cloud_run_v2_service.api.uri
}

output "artifact_registry_repository" {
  description = "Artifact Registry Docker repository path."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker.repository_id}"
}

output "default_image" {
  description = "Default image path for this service."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker.repository_id}/${local.service_name}"
}

output "cf_aig_token_secret_id" {
  description = "Secret Manager secret ID for CF_AIG_TOKEN. Add the secret version outside Terraform."
  value       = google_secret_manager_secret.cf_aig_token.secret_id
}
