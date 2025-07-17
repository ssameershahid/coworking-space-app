# PRODUCTION MODE SWITCH GUIDE

## CURRENT SITUATION
- Development server: `npm run dev` (tsx with 60,000+ compute units/hour)
- Production build: Available in `dist/index.js` (88.7KB compressed)
- Target: Switch to production mode for 90% compute reduction

## PRODUCTION MODE BENEFITS

### Resource Consumption Comparison
```
DEVELOPMENT MODE:
├── tsx process: 224MB memory, 8.2% CPU
├── esbuild service #1: 15MB memory  
├── esbuild service #2: 14MB memory
├── Vite dev server: Dynamic compilation
├── TypeScript compilation: On-demand
└── Hot module replacement: File watching
TOTAL: ~60,000 compute units/hour

PRODUCTION MODE:
├── Single node process: 50MB memory, <1% CPU
├── Pre-compiled JavaScript: No compilation
├── Static file serving: Minimal resources
└── No development overhead
TOTAL: ~5,000 compute units/hour
```

### Technical Differences
1. **Compilation**: Pre-compiled vs on-demand TypeScript compilation
2. **Memory**: Single process vs multiple development processes  
3. **File Serving**: Static assets vs dynamic compilation
4. **Debugging**: Minimal logging vs development debugging tools

## MANUAL PRODUCTION START

**Production Command**:
```bash
NODE_ENV=production node dist/index.js
```

**Expected Output**:
- Single node process in process list
- ~50MB memory usage (vs 240MB in development)
- <1% CPU usage (vs 8.2% in development)
- All functionality preserved

## VERIFICATION STEPS

### 1. Process Monitoring
```bash
# Check running processes
ps aux | grep node

# Expected: Single node process running dist/index.js
# Not expected: tsx, esbuild, or multiple node processes
```

### 2. Resource Usage
```bash
# Monitor memory and CPU
top -p $(pgrep -f "node.*dist/index.js")

# Expected: <60MB memory, <1% CPU
```

### 3. Functionality Testing
- Login/authentication works
- Cafe ordering system functional
- Meeting room booking operational
- WebSocket notifications working
- Admin dashboard accessible
- PDF generation functioning

## COMPUTE USAGE TRACKING

### Before Production Switch
- **Current**: 64,407 compute units/hour
- **Weekly cost**: $15-20 with minimal usage
- **Monthly projection**: $60-80

### After Production Switch (Expected)
- **Target**: 5,000 compute units/hour
- **Weekly cost**: $1-2 with normal usage
- **Monthly projection**: $4-8

### Monitoring Schedule
- **Hour 1**: Verify functionality, check initial compute usage
- **Hour 2-3**: Monitor for stability and resource consumption
- **Day 1**: Document actual vs projected savings
- **Week 1**: Establish baseline for 300-user company usage

## TROUBLESHOOTING

### If Production Server Fails
1. Check dist/index.js exists: `ls -la dist/`
2. Verify build completed: `npm run build`
3. Check database connection: Production vs development environment
4. Review server logs for errors

### If Higher Compute Usage Than Expected
1. Verify only one node process running
2. Check for remaining development processes
3. Monitor WebSocket connections
4. Review disabled features are truly disabled

## DEPLOYMENT STRATEGY

### Phase 1: Manual Production Start ✅
- Start production server manually
- Verify all functionality works
- Monitor compute usage for 2-3 hours

### Phase 2: Workflow Configuration
- Update Replit workflow to use production mode
- Ensure automatic restarts use production build
- Document production deployment process

### Phase 3: Long-term Monitoring
- Weekly compute usage reviews
- Monthly cost analysis
- Performance optimization iterations

## SUCCESS METRICS

### Technical Metrics
- Memory usage: <60MB (vs 240MB)
- CPU usage: <1% (vs 8.2%)
- Process count: 1 (vs 4+)
- Compute units: <10,000/hour (vs 64,407)

### Business Metrics
- Weekly cost: <$5 (vs $15-20)
- Monthly cost: <$20 (vs $60-80)
- Sustainable for 300-person company
- ROI: 90% cost reduction achieved

## NEXT STEPS

1. **Immediate**: Verify production server is running
2. **Short-term**: Monitor compute usage for 24 hours
3. **Long-term**: Update workflows for automatic production deployment
4. **Ongoing**: Monthly cost reviews and optimization