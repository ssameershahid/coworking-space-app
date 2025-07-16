#!/bin/bash

# CalmKaaj Failsafe Protocol
# Execute when critical thresholds are exceeded

echo "🔴 CALMKAAJ FAILSAFE PROTOCOL ACTIVATED"
echo "======================================"
echo "Timestamp: $(date)"

# Check current resource usage
echo -e "\n📊 Current Resource Status:"
free -m | grep Mem | awk '{print "   Memory: " $3 "/" $2 " MB (" int($3/$2*100) "%)"}'
ps aux | grep node | grep -v grep | wc -l | xargs -I {} echo "   Node Processes: {}"

# Read latest metrics
METRICS_FILE="verification/metrics.log"
if [ -f "$METRICS_FILE" ]; then
    LAST_METRIC=$(tail -1 "$METRICS_FILE")
    echo "   Latest Metrics: $LAST_METRIC"
fi

# Emergency actions
echo -e "\n🚨 EXECUTING EMERGENCY ACTIONS:"

# 1. Kill excessive Node processes
echo "   1. Cleaning up excessive processes..."
PROC_COUNT=$(ps aux | grep node | grep -v grep | wc -l)
if [ "$PROC_COUNT" -gt 5 ]; then
    echo "      Killing oldest Node processes..."
    ps aux | grep node | grep -v grep | sort -k9 | head -n -3 | awk '{print $2}' | xargs -r kill -9
    echo "      ✅ Cleaned up excessive processes"
else
    echo "      ✅ Process count normal"
fi

# 2. Clear temporary files
echo "   2. Clearing temporary files..."
find /tmp -name "*.log" -mtime +1 -delete 2>/dev/null || true
echo "      ✅ Temporary files cleared"

# 3. Force garbage collection (if Node supports it)
echo "   3. Triggering garbage collection..."
node -e "if (global.gc) { global.gc(); console.log('   ✅ GC triggered'); } else { console.log('   ⚠️  GC not available'); }"

# 4. Create rate limiting configuration
echo "   4. Creating rate limit configuration..."
cat > rate-limit-config.json << EOF
{
  "enabled": true,
  "windowMs": 60000,
  "maxRequests": 100,
  "message": "Too many requests - Failsafe protocol active",
  "blockedRoutes": [
    "/api/admin/reports",
    "/api/admin/export",
    "/api/analytics"
  ]
}
EOF
echo "      ✅ Rate limiting configured"

# 5. Notify about downgrade recommendation
echo -e "\n⚠️  RECOMMENDED ACTIONS:"
echo "   1. Execute: replctl deploy update --power 0.5vcpu-0.5gb --max-instances 1"
echo "   2. Monitor metrics for next 30 minutes"
echo "   3. Review verification/health-report.json"
echo "   4. Consider implementing request queuing"

# 6. Generate emergency report
REPORT_FILE="verification/emergency-report-$(date +%Y%m%d-%H%M%S).txt"
{
    echo "EMERGENCY REPORT - $(date)"
    echo "========================"
    echo ""
    echo "System Status:"
    free -m
    echo ""
    echo "Process List:"
    ps aux | grep node | grep -v grep
    echo ""
    echo "Disk Usage:"
    df -h
    echo ""
    echo "Recent Errors:"
    tail -50 /tmp/*.log 2>/dev/null | grep -i error || echo "No recent errors found"
} > "$REPORT_FILE"

echo -e "\n📄 Emergency report saved to: $REPORT_FILE"
echo -e "\n✅ FAILSAFE PROTOCOL COMPLETE"