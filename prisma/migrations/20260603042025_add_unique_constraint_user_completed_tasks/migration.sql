-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(100) NULL,
    `college` VARCHAR(150) NULL,
    `city` VARCHAR(120) NULL,
    `bio` TEXT NULL,
    `skills` TEXT NULL,
    `portfolio` VARCHAR(255) NULL,
    `avatar_url` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `gender` VARCHAR(20) NULL,
    `credits` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `display_preference` VARCHAR(50) NULL DEFAULT 'Show Real Name Only',
    `screen_name` VARCHAR(100) NULL,
    `social_links` TEXT NULL,
    `email_verified` BOOLEAN NOT NULL DEFAULT false,
    `email_verified_at` TIMESTAMP(0) NULL,
    `verification_token` VARCHAR(255) NULL,
    `verification_token_expires` TIMESTAMP(0) NULL,
    `reset_token` VARCHAR(255) NULL,
    `reset_token_expires` TIMESTAMP(0) NULL,
    `secondary_role` VARCHAR(100) NULL,

    UNIQUE INDEX `uq_users_email`(`email`),
    UNIQUE INDEX `uq_users_verification_token`(`verification_token`),
    UNIQUE INDEX `uq_users_reset_token`(`reset_token`),
    INDEX `idx_users_secondary_role`(`secondary_role`),
    INDEX `idx_users_email_verified`(`email_verified`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scripts` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NULL,
    `title` VARCHAR(180) NOT NULL,
    `genre` VARCHAR(80) NULL,
    `synopsis` TEXT NULL,
    `poster_url` VARCHAR(255) NULL,
    `roles_needed` VARCHAR(255) NULL,
    `status` VARCHAR(80) NOT NULL DEFAULT 'Open for collaboration',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `media_links` TEXT NULL,
    `role_data` TEXT NULL,
    `work_type` VARCHAR(50) NOT NULL DEFAULT 'Script',
    `approval_status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `approved_by` INTEGER UNSIGNED NULL,
    `approved_at` TIMESTAMP(0) NULL,
    `moderation_notes` TEXT NULL,
    `payment_status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `payment_id` VARCHAR(255) NULL,
    `payment_verified` BOOLEAN NOT NULL DEFAULT false,

    INDEX `idx_scripts_user_id`(`user_id`),
    INDEX `idx_scripts_genre`(`genre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `collaboration_requests` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `script_id` INTEGER UNSIGNED NOT NULL,
    `requester_id` INTEGER UNSIGNED NOT NULL,
    `owner_id` INTEGER UNSIGNED NOT NULL,
    `message` TEXT NULL,
    `status` VARCHAR(40) NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_requests_owner_id`(`owner_id`),
    INDEX `idx_requests_requester_id`(`requester_id`),
    UNIQUE INDEX `uq_script_requester`(`script_id`, `requester_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversations` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `avatar_url` VARCHAR(255) NULL,
    `is_group` BOOLEAN NOT NULL DEFAULT false,
    `name` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversation_members` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `conversation_id` INTEGER UNSIGNED NOT NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'Member',
    `joined_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `conversation_members_conversation_id_user_id_key`(`conversation_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tasks` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `conversation_id` INTEGER UNSIGNED NULL,
    `creator_id` INTEGER UNSIGNED NULL,
    `assignee_id` INTEGER UNSIGNED NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `credits` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `category` VARCHAR(100) NOT NULL DEFAULT 'general',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
    `priority` VARCHAR(50) NOT NULL DEFAULT 'Medium',
    `due_date` TIMESTAMP(0) NULL,
    `reward_credits` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `approval_status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
    `completed_at` TIMESTAMP(0) NULL,
    `approved_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_submissions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `task_id` INTEGER UNSIGNED NOT NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `credits_awarded` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_task_submissions_user_id`(`user_id`),
    INDEX `idx_task_submissions_status`(`status`),
    UNIQUE INDEX `uq_task_submission_user`(`task_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credit_transactions` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `amount` INTEGER NOT NULL,
    `reason` VARCHAR(255) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `issues` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `location` VARCHAR(255) NULL,
    `severity` VARCHAR(50) NOT NULL DEFAULT 'low',
    `screenshot` VARCHAR(255) NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'open',
    `priority` VARCHAR(50) NOT NULL DEFAULT 'medium',
    `assigned_admin` INTEGER UNSIGNED NULL,
    `resolved_at` TIMESTAMP(0) NULL,
    `platform_source` VARCHAR(50) NOT NULL DEFAULT 'main-website',
    `issue_type` VARCHAR(100) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `issues_user_id_fkey`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `conversation_id` INTEGER UNSIGNED NOT NULL,
    `sender_id` INTEGER UNSIGNED NULL,
    `content` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_messages_conversation_id`(`conversation_id`),
    INDEX `idx_messages_sender_id`(`sender_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `type` VARCHAR(80) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `body` TEXT NULL,
    `link_url` VARCHAR(255) NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_notifications_user_read`(`user_id`, `is_read`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credit_tasks` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `credits_rewarded` INTEGER UNSIGNED NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `trigger_type` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_completed_tasks` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `task_id` INTEGER UNSIGNED NOT NULL,
    `completed_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `credits_awarded` INTEGER UNSIGNED NOT NULL,

    INDEX `user_completed_tasks_user_id_idx`(`user_id`),
    INDEX `user_completed_tasks_task_id_idx`(`task_id`),
    UNIQUE INDEX `user_completed_tasks_user_id_task_id_key`(`user_id`, `task_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `script_drafts` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NULL,
    `title` VARCHAR(180) NOT NULL,
    `genre` VARCHAR(80) NULL,
    `synopsis` TEXT NULL,
    `poster_url` VARCHAR(255) NULL,
    `roles_needed` VARCHAR(255) NULL,
    `status` VARCHAR(80) NOT NULL DEFAULT 'Open for collaboration',
    `media_links` TEXT NULL,
    `role_data` TEXT NULL,
    `work_type` VARCHAR(50) NOT NULL DEFAULT 'Script',
    `temp_path` VARCHAR(255) NULL,
    `metadata` JSON NULL,
    `expires_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_drafts_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `moderation_logs` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `moderator_id` INTEGER UNSIGNED NULL,
    `action` VARCHAR(100) NOT NULL,
    `script_id` INTEGER UNSIGNED NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_moderation_logs_moderator_id`(`moderator_id`),
    INDEX `idx_moderation_logs_script_id`(`script_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `script_upload_payments` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `draft_id` INTEGER UNSIGNED NULL,
    `script_id` INTEGER UNSIGNED NULL,
    `razorpay_order_id` VARCHAR(255) NOT NULL,
    `razorpay_payment_id` VARCHAR(255) NULL,
    `razorpay_signature` VARCHAR(255) NULL,
    `amount` DECIMAL(10, 2) NOT NULL DEFAULT 49.00,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_payments_order_id`(`razorpay_order_id`),
    INDEX `idx_payments_user_id`(`user_id`),
    INDEX `idx_payments_draft_id`(`draft_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `scripts` ADD CONSTRAINT `scripts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collaboration_requests` ADD CONSTRAINT `collaboration_requests_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collaboration_requests` ADD CONSTRAINT `collaboration_requests_requester_id_fkey` FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `collaboration_requests` ADD CONSTRAINT `collaboration_requests_script_id_fkey` FOREIGN KEY (`script_id`) REFERENCES `scripts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation_members` ADD CONSTRAINT `conversation_members_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation_members` ADD CONSTRAINT `conversation_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_submissions` ADD CONSTRAINT `task_submissions_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_submissions` ADD CONSTRAINT `task_submissions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_transactions` ADD CONSTRAINT `credit_transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `issues` ADD CONSTRAINT `issues_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_completed_tasks` ADD CONSTRAINT `user_completed_tasks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_completed_tasks` ADD CONSTRAINT `user_completed_tasks_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `credit_tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `moderation_logs` ADD CONSTRAINT `moderation_logs_moderator_id_fkey` FOREIGN KEY (`moderator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `script_upload_payments` ADD CONSTRAINT `script_upload_payments_draft_id_fkey` FOREIGN KEY (`draft_id`) REFERENCES `script_drafts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
