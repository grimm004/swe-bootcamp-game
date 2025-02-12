using GameServer.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace GameServer.Data;

public class GameServerDbContext(DbContextOptions<GameServerDbContext> options) : DbContext(options)
{
    internal DbSet<User> Users { get; set; }
    internal DbSet<AuthRole> AuthRoles { get; set; }
    internal DbSet<AuthSession> AuthSessions { get; set; }
    internal DbSet<Lobby> Lobbies { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity
                .HasKey(u => u.Id);

            entity
                .HasIndex(u => u.Username)
                .IsUnique();

            entity
                .Property(u => u.Username)
                .HasMaxLength(16)
                .IsRequired();

            entity
                .Property(u => u.DisplayName)
                .HasMaxLength(64)
                .IsRequired();

            entity
                .Property(u => u.PasswordSalt)
                .HasMaxLength(16)
                .IsRequired();

            entity
                .Property(u => u.PasswordHash)
                .HasMaxLength(64)
                .IsRequired();

            entity
                .Property(u => u.CreatedAt)
                .IsRequired();

            entity
                .HasMany(u => u.Sessions)
                .WithOne(s => s.User)
                .HasForeignKey(s => s.UserId);

            entity
                .HasMany(u => u.Roles)
                .WithMany(r => r.Users);
        });

        modelBuilder.Entity<AuthRole>(entity =>
        {
            entity
                .HasKey(r => r.Name);

            entity
                .Property(r => r.Name)
                .HasMaxLength(32)
                .IsRequired();

            entity
                .Property(r => r.Description)
                .HasMaxLength(128)
                .IsRequired();

            entity
                .HasMany(r => r.Users)
                .WithMany(u => u.Roles);
        });

        modelBuilder.Entity<AuthSession>(entity =>
        {
            entity
                .HasKey(s => s.Id);

            entity
                .HasOne(s => s.User)
                .WithMany(u => u.Sessions)
                .HasForeignKey(s => s.UserId);

            entity
                .Property(s => s.TokenHash)
                .HasMaxLength(32)
                .IsRequired();

            entity
                .Property(s => s.CreatedAt)
                .IsRequired();

            entity
                .Property(s => s.ExpiresAt)
                .IsRequired();

            entity
                .Property(s => s.RevokedAt);
        });

        modelBuilder.Entity<Lobby>(entity =>
        {
            entity
                .HasKey(l => l.Id);

            entity
                .HasIndex(l => l.JoinCode)
                .IsUnique();

            entity
                .Property(l => l.JoinCode)
                .HasMaxLength(8)
                .IsRequired();

            entity
                .Property(l => l.Status)
                .IsRequired();

            entity
                .HasOne(l => l.Host);

            entity
                .HasMany(l => l.Users)
                .WithOne(u => u.Lobby)
                .HasForeignKey(u => u.LobbyId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}