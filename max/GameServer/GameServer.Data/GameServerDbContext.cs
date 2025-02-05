using GameServer.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace GameServer.Data;

public class GameServerDbContext(DbContextOptions<GameServerDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var userEntity = modelBuilder.Entity<User>();

        userEntity
            .HasKey(u => u.Id);

        userEntity
            .Property(u => u.Username)
            .HasMaxLength(32)
            .IsRequired();

        userEntity
            .Property(u => u.Email)
            .HasMaxLength(128)
            .IsRequired();

        userEntity
            .Property(u => u.DisplayName)
            .HasMaxLength(64);

        userEntity
            .Property(u => u.PasswordHash)
            .HasMaxLength(64)
            .IsRequired();
    }
}