resource "google_secret_manager_secret" "cf_aig_token" {
  project   = var.project_id
  secret_id = var.cf_aig_token_secret_id

  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }

  depends_on = [
    google_project_service.required_apis,
  ]
}
