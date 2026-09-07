# Deploy to Google Cloud Run

This document describes the stage deployment setup for
`article-video-recommendation-service`.

Terraform state is stored remotely in the GCS bucket
`ai-video-rec-stage-terraform-state` under the
`article-video-recommendation-service/stage` prefix.

## One-Time Setup

The stage Google Cloud project is `ai-video-rec-stage-498719`. Make sure your
account has access to the project and to the Terraform state bucket before
running Terraform.

Authenticate locally:

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project ai-video-rec-stage-498719
```

## Terraform Init, Plan, Apply

Terraform is located inside the application repo:

```bash
cd .gcp/terraform
terraform init
terraform validate
terraform plan -input=false -var-file=environments/stage.tfvars
```

After reviewing the plan, infrastructure changes can be applied explicitly:

```bash
terraform apply -var-file=environments/stage.tfvars
```

This creates the required Google APIs, Artifact Registry repository, Secret
Manager secret metadata, Cloud Run runtime service account, Cloud Run service
skeleton, and temporary public invoker access.

`environments/stage.tfvars` contains only non-secret stage configuration and is
version-controlled. Do not commit local `terraform.tfvars`, `.terraform/`, or
any `*.tfstate` files.

## Add Secret Value Manually

Terraform creates the `cf-aig-token` secret metadata only. It does not create
secret versions and must never store the actual `CF_AIG_TOKEN` value.

Add the secret value in Google Cloud Console:

Google Cloud Console -> Secret Manager -> `cf-aig-token` -> Add version

Or use `gcloud`:

```bash
printf "TOKEN_VALUE" | gcloud secrets versions add cf-aig-token \
  --data-file=- \
  --project ai-video-rec-stage-498719
```

If the initial `terraform apply` fails because the Cloud Run revision references
`latest` before a secret version exists, add the secret version and rerun:

```bash
terraform apply -var-file=environments/stage.tfvars
```

## Build and Push Docker Image

From the repository root:

```bash
IMAGE=europe-north1-docker.pkg.dev/ai-video-rec-stage-498719/article-video-recommendation-service/article-video-recommendation-service

gcloud builds submit \
  --project ai-video-rec-stage-498719 \
  --region europe-north1 \
  --config .gcp/build/cloudbuild.yaml \
  --substitutions _IMAGE=$IMAGE \
  .
```

Alternatively, build and push locally:

```bash
IMAGE=europe-north1-docker.pkg.dev/ai-video-rec-stage-498719/article-video-recommendation-service/article-video-recommendation-service

gcloud auth configure-docker europe-north1-docker.pkg.dev
docker build -t "${IMAGE}:latest" .
docker push "${IMAGE}:latest"
```

## Update Cloud Run Image

Terraform manages the infrastructure, environment variables, IAM, and secret
references. The deployed application image is updated separately, similar to the
Nordic-style deploy scripts.

```bash
IMAGE=europe-north1-docker.pkg.dev/ai-video-rec-stage-498719/article-video-recommendation-service/article-video-recommendation-service

gcloud run services update article-video-recommendation-service \
  --image "${IMAGE}:latest" \
  --region europe-north1 \
  --project ai-video-rec-stage-498719
```

## Test

Get the Cloud Run URL:

```bash
gcloud run services describe article-video-recommendation-service \
  --region europe-north1 \
  --project ai-video-rec-stage-498719 \
  --format 'value(status.url)'
```

Call the health endpoint:

```bash
curl "$(gcloud run services describe article-video-recommendation-service \
  --region europe-north1 \
  --project ai-video-rec-stage-498719 \
  --format 'value(status.url)')/health"
```

Expected response:

```json
{ "ok": true }
```

## Important Notes

- Do not commit `.env`.
- Do not commit `terraform.tfvars`.
- Do not commit `terraform.tfstate` or `terraform.tfstate.backup`.
- Do not put `CF_AIG_TOKEN` in Terraform variables or tfvars.
- Stage Terraform state is stored in the configured remote GCS backend.
- Public unauthenticated Cloud Run access is only for this temporary test/stage
  setup.
