# AWS ECS/Fargate + RDS Deployment Guide
## distro-platform B2B Ordering System

---

## 📋 Complete Step-by-Step AWS Deployment

### Prerequisites
- AWS Account (free tier eligible)
- AWS CLI installed and configured
- Docker installed
- GitHub repository pushed (✅ Already done!)

---

## PHASE 1: AWS Account & IAM Setup

### Step 1.1: Create AWS Account
1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Fill in details and sign up for free tier
4. **Save your credentials safely**

### Step 1.2: Create IAM User for Deployment
1. Go to **AWS Console** → **IAM** → **Users** → **Create User**
2. Username: `distro-deployer`
3. Click **Next**
4. **Attach policies directly:**
   - ✅ `AmazonEC2FullAccess`
   - ✅ `AmazonRDSFullAccess`
   - ✅ `AmazonECS_FullAccess`
   - ✅ `AmazonEC2ContainerRegistryFullAccess`
   - ✅ `SecretsManagerReadWrite`
5. Click **Create User**

### Step 1.3: Generate Access Keys
1. Click the new user name
2. Go to **Security Credentials** tab
3. Click **Create access key**
4. Choose **Command Line Interface (CLI)**
5. Accept the warning
6. **Copy and save:**
   - Access Key ID
   - Secret Access Key

---

## PHASE 2: Configure AWS CLI

```powershell
# Install AWS CLI (if not already installed)
choco install awscli

# Configure with your credentials
aws configure

# When prompted:
# AWS Access Key ID: [paste your Access Key ID]
# AWS Secret Access Key: [paste your Secret Access Key]
# Default region name: us-east-1
# Default output format: json
```

### Verify configuration:
```powershell
aws sts get-caller-identity
# Output should show your account details
```

---

## PHASE 3: Create ECR Repositories

```powershell
# Get your AWS Account ID
$ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
Write-Host "Account ID: $ACCOUNT_ID"

# Create ECR repositories
aws ecr create-repository --repository-name distro-api --region us-east-1
aws ecr create-repository --repository-name distro-web --region us-east-1

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

---

## PHASE 4: Build and Push Docker Images

### Navigate to project root:
```powershell
cd D:\distro-platform\distro-platform
```

### Run deployment script:
```powershell
# Run the deployment script we created
.\deploy-aws.ps1

# When prompted, enter your AWS Account ID
```

**This will:**
1. ✅ Build API Docker image
2. ✅ Build Web Docker image
3. ✅ Push both to AWS ECR
4. ✅ Get image URIs for next step

---

## PHASE 5: Create RDS PostgreSQL Database

### In AWS Console:

1. Go to **RDS** → **Databases** → **Create Database**

2. **Engine Selection:**
   - Engine type: PostgreSQL
   - Version: 16.x (latest)
   - Template: **Free tier** (important!)

3. **DB Cluster Identifier:** `distro-db-cluster`

4. **Credentials:**
   - Master username: `distro_admin`
   - Password: Create a strong password (save it!)

5. **DB Instance:**
   - Instance class: `db.t4g.micro` (free tier)
   - Storage: 20 GB (free tier max)
   - Storage autoscaling: Disabled

6. **Connectivity:**
   - VPC: Default VPC
   - Publicly accessible: **Yes**
   - Security group: Create new
     - Name: `distro-rds-sg`

7. **Database Options:**
   - Initial database name: `distro_platform`

8. **Backups:**
   - Backup retention: 7 days

9. Click **Create Database**

### Wait for creation (~5-10 minutes)

### Get Connection Details:
1. Click the database name
2. Find **Endpoint** section
3. Copy the **Writer endpoint** (e.g., `distro-db-cluster.xxxxx.us-east-1.rds.amazonaws.com`)
4. Note the port (5432 by default)

### Create DATABASE_URL:
```
postgresql://distro_admin:YOUR_PASSWORD@distro-db-cluster.xxxxx.us-east-1.rds.amazonaws.com:5432/distro_platform?schema=public
```

---

## PHASE 6: Create ECS Cluster

### In AWS Console:

1. Go to **ECS** → **Clusters** → **Create Cluster**

2. **Cluster name:** `distro-production`

3. **Infrastructure:** 
   - AWS Fargate (default)

4. **Monitoring:**
   - Container Insights: Optional (disable for free tier)

5. Click **Create**

---

## PHASE 7: Create CloudWatch Log Groups

```powershell
# Create log groups for ECS
aws logs create-log-group --log-group-name /ecs/distro-api --region us-east-1
aws logs create-log-group --log-group-name /ecs/distro-web --region us-east-1

# Set retention (optional)
aws logs put-retention-policy --log-group-name /ecs/distro-api --retention-in-days 7 --region us-east-1
aws logs put-retention-policy --log-group-name /ecs/distro-web --retention-in-days 7 --region us-east-1
```

---

## PHASE 8: Store Secrets in AWS Secrets Manager

```powershell
$ACCOUNT_ID = aws sts get-caller-identity --query Account --output text

# Generate strong secrets (update these!)
$JWT_ACCESS_SECRET = "your-super-secret-key-at-least-32-chars-long-12345!@#"
$JWT_REFRESH_SECRET = "your-refresh-secret-at-least-32-chars-long-67890!@#"
$DATABASE_URL = "postgresql://distro_admin:YOUR_PASSWORD@distro-db-cluster.xxxxx.us-east-1.rds.amazonaws.com:5432/distro_platform?schema=public"

# Store in Secrets Manager
aws secretsmanager create-secret --name distro/jwt-access-secret --secret-string $JWT_ACCESS_SECRET --region us-east-1
aws secretsmanager create-secret --name distro/jwt-refresh-secret --secret-string $JWT_REFRESH_SECRET --region us-east-1
aws secretsmanager create-secret --name distro/database-url --secret-string $DATABASE_URL --region us-east-1
```

---

## PHASE 9: Create ECS Task Execution Role (via AWS Console)

1. Go to **IAM** → **Roles** → **Create Role**

2. **Trusted entity type:** AWS Service

3. **Use case:** Elastic Container Service → Elastic Container Service Task

4. Click **Next**

5. **Attach policies:**
   - ✅ `AmazonECSTaskExecutionRolePolicy`
   - ✅ `SecretsManagerReadWrite`

6. **Role name:** `ecsTaskExecutionRole`

7. Click **Create Role**

---

## PHASE 10: Register ECS Task Definitions

### Update the task definition files with your values:

```powershell
# Get your account ID
$ACCOUNT_ID = aws sts get-caller-identity --query Account --output text

# Get ECR image URIs
$API_IMAGE = "$ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/distro-api:latest"
$WEB_IMAGE = "$ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/distro-web:latest"

Write-Host "API Image: $API_IMAGE"
Write-Host "Web Image: $WEB_IMAGE"
```

### Edit `ecs-task-definition-api.json`:
Replace:
- `REPLACE_WITH_ECR_API_IMAGE` with `$API_IMAGE`
- `REPLACE_WITH_ACCOUNT_ID` with your account ID

### Edit `ecs-task-definition-web.json`:
Replace:
- `REPLACE_WITH_ECR_WEB_IMAGE` with `$WEB_IMAGE`
- `REPLACE_WITH_ACCOUNT_ID` with your account ID
- `REPLACE_WITH_API_ALB_URL` with API ALB endpoint (get after creating service)

### Register task definitions:

```powershell
aws ecs register-task-definition --cli-input-json file://ecs-task-definition-api.json --region us-east-1
aws ecs register-task-definition --cli-input-json file://ecs-task-definition-web.json --region us-east-1
```

---

## PHASE 11: Create Application Load Balancer (ALB)

### In AWS Console:

1. Go to **EC2** → **Load Balancers** → **Create Load Balancer**

2. Choose **Application Load Balancer**

3. **Basic Configuration:**
   - Name: `distro-alb`
   - Scheme: Internet-facing
   - IP address type: IPv4

4. **Network Mapping:**
   - VPC: Default VPC
   - Subnets: Select at least 2

5. **Security Groups:**
   - Create new security group: `distro-alb-sg`
   - Allow HTTP (80) from anywhere
   - Allow HTTPS (443) from anywhere

6. Click **Next**

7. **Listeners and routing:**
   - HTTP:80 → Create target group

8. Create target group:
   - Name: `distro-api-targets`
   - Protocol: HTTP
   - Port: 4000
   - VPC: Default
   - Click **Create**

9. Complete ALB creation

### Get ALB DNS Name:
- Copy the DNS name (e.g., `distro-alb-xxx.us-east-1.elb.amazonaws.com`)

---

## PHASE 12: Create ECS Services

### API Service:

```powershell
aws ecs create-service `
  --cluster distro-production `
  --service-name distro-api-service `
  --task-definition distro-api:1 `
  --desired-count 1 `
  --launch-type FARGATE `
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:$ACCOUNT_ID:targetgroup/distro-api-targets/xxxxx,containerName=distro-api,containerPort=4000 `
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" `
  --region us-east-1
```

### Web Service:

```powershell
aws ecs create-service `
  --cluster distro-production `
  --service-name distro-web-service `
  --task-definition distro-web:1 `
  --desired-count 1 `
  --launch-type FARGATE `
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:$ACCOUNT_ID:targetgroup/distro-web-targets/xxxxx,containerName=distro-web,containerPort=3000 `
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" `
  --region us-east-1
```

---

## ✅ DEPLOYMENT COMPLETE!

### Access Your Application:
- **Web App:** `http://distro-alb-xxx.us-east-1.elb.amazonaws.com`
- **API:** `http://distro-alb-xxx.us-east-1.elb.amazonaws.com:4000/api/v1`
- **Swagger Docs:** `http://distro-alb-xxx.us-east-1.elb.amazonaws.com:4000/api/docs`

### Share with Client:
```
Web App URL: http://distro-alb-xxx.us-east-1.elb.amazonaws.com
```

---

## 💰 Cost Estimation (Free Tier)

| Service | Free Tier | Cost |
|---------|-----------|------|
| **ECR** | 500MB/month | Free |
| **ECS Fargate** | 750 hours/month | Free |
| **RDS PostgreSQL** | 750 hours/month | Free |
| **ALB** | First 15 LCU/month | Free |
| **Data Transfer** | 100GB/month out | Free |
| **Total (first year)** | - | **$0** |
| **After free tier** | - | ~$25/month |

---

## 🚀 Troubleshooting

### Tasks not starting?
```powershell
# Check ECS service
aws ecs describe-services --cluster distro-production --services distro-api-service --region us-east-1

# Check task logs
aws logs tail /ecs/distro-api --follow --region us-east-1
```

### RDS connection failed?
```powershell
# Check security group
aws ec2 describe-security-groups --group-ids sg-xxxxx --region us-east-1
```

### ALB not routing?
```powershell
# Check target health
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:... --region us-east-1
```

---

## 📖 Next Steps

1. ✅ Run deployment script
2. ✅ Create RDS database
3. ✅ Set up Secrets Manager
4. ✅ Create ECS cluster
5. ✅ Create ALB
6. ✅ Deploy services
7. ✅ Share URL with client
8. ⏭️ Setup CI/CD for auto-deployment (next phase)
9. ⏭️ Setup custom domain (Route 53)
10. ⏭️ Setup HTTPS/SSL (ACM)

---

## Support Resources

- AWS ECS Documentation: https://docs.aws.amazon.com/ecs/
- AWS RDS Documentation: https://docs.aws.amazon.com/rds/
- Free Tier Limits: https://aws.amazon.com/free/
