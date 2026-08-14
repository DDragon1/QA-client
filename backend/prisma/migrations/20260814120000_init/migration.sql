-- CreateSchema

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('manual', 'automatic');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('need_to_run', 'done', 'need_to_rerun');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('success', 'failed', 'has_bug');

-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('INT', 'PRP', 'DRL', 'OPR');

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "team_id" TEXT,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" TEXT NOT NULL,
    "feature_id" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    "expected_result" TEXT NOT NULL,
    "type" "TestType" NOT NULL DEFAULT 'manual',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_versions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "environment" "Environment" NOT NULL DEFAULT 'INT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "app_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "version_test_runs" (
    "id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "test_case_id" TEXT NOT NULL,
    "run_status" "RunStatus" NOT NULL DEFAULT 'need_to_run',
    "result_status" "ResultStatus",
    "notes" TEXT,
    "last_updated_by" TEXT,
    "row_version" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "snapshot_feature_name" TEXT,
    "snapshot_team_name" TEXT,
    "snapshot_scenario" TEXT,
    "snapshot_steps" TEXT,
    "snapshot_expected_result" TEXT,
    "snapshot_type" "TestType",

    CONSTRAINT "version_test_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE INDEX "features_team_id_idx" ON "features"("team_id");

-- CreateIndex
CREATE INDEX "test_cases_feature_id_idx" ON "test_cases"("feature_id");

-- CreateIndex
CREATE INDEX "test_cases_is_active_idx" ON "test_cases"("is_active");

-- CreateIndex
CREATE INDEX "app_versions_finished_at_idx" ON "app_versions"("finished_at");

-- CreateIndex
CREATE INDEX "app_versions_environment_idx" ON "app_versions"("environment");

-- CreateIndex
CREATE INDEX "version_test_runs_test_case_id_idx" ON "version_test_runs"("test_case_id");

-- CreateIndex
CREATE INDEX "version_test_runs_last_updated_by_idx" ON "version_test_runs"("last_updated_by");

-- CreateIndex
CREATE UNIQUE INDEX "version_test_runs_version_id_test_case_id_key" ON "version_test_runs"("version_id", "test_case_id");

-- AddForeignKey
ALTER TABLE "features" ADD CONSTRAINT "features_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "version_test_runs" ADD CONSTRAINT "version_test_runs_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "app_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "version_test_runs" ADD CONSTRAINT "version_test_runs_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
