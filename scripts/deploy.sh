#!/bin/bash
# Main deployment script for Kas Kelas
# Usage: ./deploy.sh [environment]
# Environment: development | staging | production

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-production}"

echo "=== Kas Kelas Deployment Script ==="
echo "Environment: $ENVIRONMENT"
echo "Project Directory: $PROJECT_DIR"

# Validate environment
case "$ENVIRONMENT" in
  development|staging|production) ;;
  *) echo "❌ Invalid environment. Use: development, staging, or production"; exit 1;;
esac

# Check required tools
check_tools() {
  local missing=0
  for tool in kubectl helm docker; do
    if ! command -v "$tool" &>/dev/null; then
      echo "⚠️  $tool not found - skipping $tool operations"
      missing=1
    fi
  done
  return $missing
}

# Set environment-specific values
set_environment() {
  case "$ENVIRONMENT" in
    development)
      IMAGE_TAG="latest-dev"
      REPLICAS_API=1
      REPLICAS_FRONTEND=1
      NAMESPACE="kas-kelas-dev"
      INGRESS_HOST="kas-kelas-dev.yourdomain.com"
      ;;
    staging)
      IMAGE_TAG="latest-staging"
      REPLICAS_API=2
      REPLICAS_FRONTEND=2
      NAMESPACE="kas-kelas-staging"
      INGRESS_HOST="kas-kelas-staging.yourdomain.com"
      ;;
    production)
      IMAGE_TAG="latest"
      REPLICAS_API=2
      REPLICAS_FRONTEND=2
      NAMESPACE="kas-kelas"
      INGRESS_HOST="kas-kelas.yourdomain.com"
      ;;
  esac
}

# Deploy to AKS
deploy_to_aks() {
  echo "🚀 Deploying to AKS namespace: $NAMESPACE"

  # Set AKS context (requires AZURE_CREDENTIALS secret)
  if [ -n "${AZURE_CREDENTIALS:-}" ]; then
    az aks get-credentials --admin \
      --name "${AKS_NAME:-kas-kelas-aks}" \
      --resource-group "${AKS_RG:-kas-kelas-rg}" \
      --overwrite-existing 2>/dev/null || {
      echo "⚠️  Could not set AKS credentials - assuming already configured"
    }
  fi

  # Apply namespace if not exists
  kubectl get namespace "$NAMESPACE" >/dev/null 2>&1 || \
    kubectl create namespace "$NAMESPACE"

  # Set image tags in manifests
  sed -i "|__IMAGE_TAG__|g;s|__IMAGE_TAG__|$IMAGE_TAG|g" k8s/*/*.yml 2>/dev/null || true

  # Apply ConfigMaps and Secrets (without sensitive values)
  kubectl apply -f k8s/configmap.yml -n "$NAMESPACE"
  kubectl apply -f k8s/secret.yml -n "$NAMESPACE"

  # Apply application manifests
  kubectl apply -f k8s/namespace.yml -n "$NAMESPACE" 2>/dev/null
  kubectl apply -f k8s/api-deployment.yml -n "$NAMESPACE"
  kubectl apply -f k8s/api-service.yml -n "$NAMESPACE"
  kubectl apply -f k8s/frontend-deployment.yml -n "$NAMESPACE"
  kubectl apply -f k8s/frontend-service.yml -n "$NAMESPACE"
  kubectl apply -f k8s/ingress.yml -n "$NAMESPACE"
  kubectl apply -f k8s/hpa.yml -n "$NAMESPACE"

  # Wait for rollout
  echo "⏳ Waiting for API rollout..."
  kubectl rollout status deployment/kas-kelas-api -n "$NAMESPACE" --timeout=180s

  echo "⏳ Waiting for Frontend rollout..."
  kubectl rollout status deployment/kas-kelas-frontend -n "$NAMESPACE" --timeout=180s

  echo "✅ Deployment complete!"
  echo "🌐 Access via: https://$INGRESS_HOST"
}

# Main execution
check_tools
set_environment
deploy_to_aks