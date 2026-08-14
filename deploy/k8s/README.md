# Sample Kubernetes / OpenShift manifests
#
# Copy and adapt. Replace image names, hosts, and secrets before use.
# This is not a production Helm chart: no TLS secrets, operators, or CI.
#
# Apply order (after building and pushing images):
#   kubectl apply -f postgres.yaml -f backend.yaml -f frontend.yaml
#   kubectl apply -f ingress.yaml
#
# OpenShift:
#   - Prefer Route objects instead of Ingress (examples at the bottom of ingress.yaml).
#   - Set PORT=8080 on both frontend and backend (unprivileged listen).
#   - Do not run containers as root; these images are writable as an arbitrary UID (GID 0).
#   - Build with: oc new-build --binary --name=qa-backend  (or your registry pipeline).
