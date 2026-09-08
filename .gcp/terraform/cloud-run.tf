locals {
  plain_environment_variables = {
    NODE_ENV                      = "production"
    VIDEO_METADATA_API_BASE_URL   = "https://video-metadata-api.prod.aller.cloud"
    VIDEO_RECOMMENDATIONS_API_URL = "https://aller-recommendations.mediehub.stream/api/search"
    AI_GATEWAY_BASE_URL           = "https://gateway.ai.cloudflare.com/v1/f40c46d48669187fc6bb2c53761b7d6b/llm-gateway/compat"
    AI_GATEWAY_MODEL              = "google-vertex-ai/google/gemini-2.5-flash"
    REQUEST_BODY_LIMIT            = "2mb"
  }
}

resource "google_cloud_run_v2_service" "api" {
  name                = local.service_name
  project             = var.project_id
  location            = var.region
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = false

  template {
    service_account                  = google_service_account.cloud_run_runtime.email
    max_instance_request_concurrency = 10
    timeout                          = "120s"

    scaling {
      min_instance_count = 0
      max_instance_count = 1
    }

    containers {
      image = var.image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      dynamic "env" {
        for_each = local.plain_environment_variables
        content {
          name  = env.key
          value = env.value
        }
      }

      env {
        name = "CF_AIG_TOKEN"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.cf_aig_token.secret_id
            version = "latest"
          }
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      template[0].labels,
      client,
      client_version,
    ]
  }

  depends_on = [
    google_project_service.required_apis,
    google_secret_manager_secret_iam_member.runtime_cf_aig_token_access,
  ]
}

# Public unauthenticated access is for the temporary personal stage/test setup.
resource "google_cloud_run_service_iam_member" "public_invoker" {
  project  = google_cloud_run_v2_service.api.project
  location = google_cloud_run_v2_service.api.location
  service  = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
