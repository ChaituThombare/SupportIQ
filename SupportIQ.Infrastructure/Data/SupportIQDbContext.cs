using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Microsoft.EntityFrameworkCore;
using SupportIQ.Domain.Entities;

namespace SupportIQ.Infrastructure.Data
{
    public class SupportIQDbContext : DbContext
    {
        public SupportIQDbContext(DbContextOptions<SupportIQDbContext> options) : base(options) { }

        public DbSet<Role> Roles => Set<Role>();
        public DbSet<User> Users => Set<User>();
        public DbSet<Category> Categories=> Set<Category>();
        public DbSet<Ticket> Tickets=> Set<Ticket>();
        public DbSet<Message> Messages => Set<Message>();
        public DbSet<Attachment> Attachments => Set<Attachment>();
        public DbSet<KnowledgeDocument> KnowledgeDocuments => Set<KnowledgeDocument>();
        public DbSet<KnowledgeChunk> KnowledgeChunks => Set<KnowledgeChunk>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Role
            modelBuilder.Entity<Role>(entity =>
            {
                entity.HasKey(r => r.RoleId);

                entity.Property(r => r.RoleName)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.HasIndex(r => r.RoleName)
                    .IsUnique();
            });

            // User
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.UserId);

                entity.Property(u => u.Name)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(u => u.Email)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.HasIndex(u => u.Email)
                    .IsUnique();

                entity.Property(u => u.PasswordHash)
                    .IsRequired();

                entity.Property(u => u.IsActive)
                    .HasDefaultValue(true);

                entity.Property(u => u.CreatedOn)
                    .HasDefaultValueSql("GETDATE()");

                entity.HasOne(u => u.Role)
                    .WithMany(r => r.Users)
                    .HasForeignKey(u => u.RoleId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Category
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasKey(c => c.CategoryId);

                entity.Property(c => c.CategoryName)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(c => c.Description)
                    .HasMaxLength(255);

                entity.Property(c => c.IsActive)
                    .HasDefaultValue(true);

                entity.HasIndex(c => c.CategoryName)
                    .IsUnique();
            });

            // Ticket
            modelBuilder.Entity<Ticket>(entity =>
            {
                entity.HasKey(t => t.TicketId);

                entity.Property(t => t.Subject)
                    .IsRequired()
                    .HasMaxLength(150);

                entity.Property(t => t.Description)
                    .IsRequired();

                entity.Property(t => t.Priority)
                    .IsRequired()
                    .HasMaxLength(20)
                    .HasDefaultValue("Low");

                entity.Property(t => t.Status)
                    .IsRequired()
                    .HasMaxLength(30)
                    .HasDefaultValue("Open");

                entity.Property(t => t.IsAIClassified)
                    .HasDefaultValue(false);

                entity.Property(t => t.CreatedOn)
                    .HasDefaultValueSql("GETDATE()");

                // Customer
                entity.HasOne(t => t.Customer)
                    .WithMany()
                    .HasForeignKey(t => t.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Assigned Agent
                entity.HasOne(t => t.AssignedAgent)
                    .WithMany()
                    .HasForeignKey(t => t.AssignedAgentId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Category
                entity.HasOne(t => t.Category)
                    .WithMany(c => c.Tickets)
                    .HasForeignKey(t => t.CategoryId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Message
            modelBuilder.Entity<Message>(entity =>
            {
                entity.HasKey(m => m.MessageId);

                entity.Property(m => m.SenderType)
                    .IsRequired()
                    .HasMaxLength(20);

                entity.Property(m => m.MessageText)
                    .IsRequired();

                entity.Property(m => m.IsAISuggested)
                    .HasDefaultValue(false);

                entity.Property(m => m.CreatedOn)
                    .HasDefaultValueSql("GETDATE()");

                entity.HasOne(m => m.Ticket)
                    .WithMany(t => t.Messages)
                    .HasForeignKey(m => m.TicketId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(m => m.Sender)
                    .WithMany()
                    .HasForeignKey(m => m.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Attachment
            modelBuilder.Entity<Attachment>(entity =>
            {
                entity.HasKey(a => a.AttachmentId);

                entity.Property(a => a.FileName)
                    .IsRequired()
                    .HasMaxLength(255);

                entity.Property(a => a.FilePath)
                    .IsRequired()
                    .HasMaxLength(500);

                entity.Property(a => a.UploadedOn)
                    .HasDefaultValueSql("GETDATE()");

                entity.HasOne(a => a.Ticket)
                    .WithMany(t => t.Attachments)
                    .HasForeignKey(a => a.TicketId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(a => a.Message)
                    .WithMany(m => m.Attachments)
                    .HasForeignKey(a => a.MessageId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            // KnowledgeDocument
            modelBuilder.Entity<KnowledgeDocument>(entity =>
            {
                entity.HasKey(d => d.DocumentId);

                entity.Property(d => d.FileName)
                    .IsRequired()
                    .HasMaxLength(255);

                entity.Property(d => d.FileType)
                    .IsRequired()
                    .HasMaxLength(10);

                entity.Property(d => d.FilePath)
                    .IsRequired()
                    .HasMaxLength(500);

                entity.Property(d => d.Status)
                    .IsRequired()
                    .HasMaxLength(20)
                    .HasDefaultValue("Processing");

                entity.Property(d => d.UploadedOn)
                    .HasDefaultValueSql("GETDATE()");

                entity.HasOne(d => d.Uploader)
                    .WithMany()
                    .HasForeignKey(d => d.UploadedBy)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // KnowledgeChunk
            modelBuilder.Entity<KnowledgeChunk>(entity =>
            {
                entity.HasKey(c => c.ChunkId);

                entity.Property(c => c.ChunkText)
                    .IsRequired();

                entity.Property(c => c.Embedding)
                    .HasColumnType("varbinary(max)");

                entity.HasOne(c => c.Document)
                    .WithMany(d => d.Chunks)
                    .HasForeignKey(c => c.DocumentId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Audit Log
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasKey(a => a.AuditId);

                entity.Property(a => a.EntityName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(a => a.Action)
                    .IsRequired()
                    .HasMaxLength(30);

                entity.Property(a => a.CreatedOn)
                    .HasDefaultValueSql("GETDATE()");

                entity.HasOne(a => a.CreatedByUser)
                    .WithMany()
                    .HasForeignKey(a => a.CreatedBy)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Seed Data
            modelBuilder.Entity<Role>().HasData(
                new Role
                {
                    RoleId = 1,
                    RoleName = "Customer"
                },
                new Role
                {
                    RoleId = 2,
                    RoleName = "Agent"
                },
                new Role
                {
                    RoleId = 3,
                    RoleName = "Admin"
                }
            );

            // Seed Category
            modelBuilder.Entity<Category>().HasData(
                new Category
                {
                    CategoryId = 1,
                    CategoryName = "Payment",
                    Description = "Payment-realted issues"
                },
                new Category
                {
                    CategoryId = 2,
                    CategoryName = "Order",
                    Description = "Order-realted issues"
                },
                new Category
                {
                    CategoryId = 3,
                    CategoryName = "Delivery",
                    Description = "Delivery-realted issues"
                },
                new Category
                {
                    CategoryId = 4,
                    CategoryName = "Product",
                    Description = "Product-realted issues"
                },
                new Category
                {
                    CategoryId = 5,
                    CategoryName = "Refund",
                    Description = "Refund-realted issues"
                },
                new Category
                {
                    CategoryId = 6,
                    CategoryName = "Account",
                    Description = "Account-realted issues"
                },
                new Category
                {
                    CategoryId = 7,
                    CategoryName = "Technical",
                    Description = "Technical issues"
                },
                new Category
                {
                    CategoryId = 8,
                    CategoryName = "Others",
                    Description = "Other support issues"
                }
            );
        }
    }
}
