#!/bin/bash

jobs=$1
success_count=0
previous_log=""

echo "Jobs to run: $jobs"

while (( success_count < jobs )); do
    log=$(docker logs gitlab-runner --tail 1 2>&1 | grep -v "gitlab-runner" | grep -v "Checking status of gitlab-runner" | grep -v "Checking for jobs..." | grep -v "Appending trace to coordinator")
    if [ "$log" = "$previous_log" ]; then
        continue
    fi
    echo "$log"
    previous_log="$log"
    if echo "$log" | grep -q "Failed to process runner"; then
        echo "Runner failed to process"
        exit 1
    fi
    if echo "$log" | grep -q "Job failed"; then
        echo "Job failed: $success_count / $jobs"
        exit 1
    fi
    new_successes=$(echo "$log" | grep -o "Removed job from processing list" | wc -l)
    ((success_count+=new_successes))
    if (( new_successes > 0 )); then
        echo "Jobs completed: $success_count / $jobs"
    fi
done

echo "All $jobs jobs succeeded"