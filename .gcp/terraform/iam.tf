data "google_project" "project" {
  project_id = var.project_id
}

resource "google_service_account" "cloud_run_runtime" {
  project      = var.project_id
  account_id   = var.runtime_service_account_id
  display_name = "article-video-recommendation-service Cloud Run runtime"
  description  = "Runtime service account for article-video-recommendation-service on Cloud Run"

  depends_on = [
    google_project_service.required_apis,
  ]
}

resource "google_secret_manager_secret_iam_member" "runtime_cf_aig_token_access" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.cf_aig_token.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run_runtime.email}"
}

resource "google_project_iam_member" "cloud_build_artifact_registry_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${data.google_project.project.number}@cloudbuild.gserviceaccount.com"

  depends_on = [
    google_project_service.required_apis,
  ]
}
