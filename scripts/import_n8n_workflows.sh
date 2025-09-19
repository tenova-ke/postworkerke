#!/usr/bin/env bash
# requires N8N_HOST: http://localhost:5678
# and N8N_BASIC_AUTH_USER/PASSWORD set in env

N8N_API="http://localhost:5678/rest/workflows"
WORKFLOW_FILE="$1"
if [ -z "$WORKFLOW_FILE" ]; then
  echo "Usage: ./import_n8n_workflows.sh path/to/workflow.json"
  exit 1
fi

curl -u "${N8N_BASIC_AUTH_USER}:${N8N_BASIC_AUTH_PASSWORD}" -X POST \
  -H "Content-Type: application/json" \
  --data-binary @"${WORKFLOW_FILE}" \
  "${N8N_API}"
