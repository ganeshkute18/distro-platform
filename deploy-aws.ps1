# AWS Deployment Script for distro-platform
# This script builds Docker images and pushes to AWS ECR

# Configuration
$AWS_ACCOUNT_ID = Read-Host "Enter your AWS Account ID"
$AWS_REGION = "us-east-1"
$REGISTRY = "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
$API_IMAGE = "distro-api"
$WEB_IMAGE = "distro-web"
$TAG = "latest"

Write-Host "🚀 Starting AWS deployment..." -ForegroundColor Green
Write-Host "Registry: $REGISTRY" -ForegroundColor Cyan

# Step 1: Login to ECR
Write-Host "`n1️⃣  Logging into AWS ECR..." -ForegroundColor Yellow
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $REGISTRY
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ECR login failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ ECR login successful" -ForegroundColor Green

# Step 2: Build API image
Write-Host "`n2️⃣  Building API Docker image..." -ForegroundColor Yellow
docker build -t $API_IMAGE:$TAG `
    --target production `
    -f apps/api/Dockerfile `
    .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ API build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ API image built successfully" -ForegroundColor Green

# Step 3: Build Web image
Write-Host "`n3️⃣  Building Web Docker image..." -ForegroundColor Yellow
docker build -t $WEB_IMAGE:$TAG `
    --target production `
    -f apps/web/Dockerfile `
    .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Web build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Web image built successfully" -ForegroundColor Green

# Step 4: Tag images for ECR
Write-Host "`n4️⃣  Tagging images for ECR..." -ForegroundColor Yellow
docker tag "$API_IMAGE:$TAG" "$REGISTRY/$API_IMAGE:$TAG"
docker tag "$WEB_IMAGE:$TAG" "$REGISTRY/$WEB_IMAGE:$TAG"
Write-Host "✅ Images tagged" -ForegroundColor Green

# Step 5: Push to ECR
Write-Host "`n5️⃣  Pushing API image to ECR..." -ForegroundColor Yellow
docker push "$REGISTRY/$API_IMAGE:$TAG"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ API push failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ API image pushed" -ForegroundColor Green

Write-Host "`n6️⃣  Pushing Web image to ECR..." -ForegroundColor Yellow
docker push "$REGISTRY/$WEB_IMAGE:$TAG"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Web push failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Web image pushed" -ForegroundColor Green

Write-Host "`n✅ All images pushed to ECR successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Go to AWS Console > RDS > Create PostgreSQL database" -ForegroundColor Cyan
Write-Host "2. Go to AWS Console > ECS > Create Cluster & Services" -ForegroundColor Cyan
Write-Host "3. Update environment variables with RDS endpoint" -ForegroundColor Cyan
