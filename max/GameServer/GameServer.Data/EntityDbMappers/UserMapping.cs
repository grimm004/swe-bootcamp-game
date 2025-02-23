using GameServer.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameServer.Data.EntityDbMappers;

internal class UserMapping : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder
            .HasKey(u => u.Id);

        builder
            .HasIndex(u => u.Username)
            .IsUnique();

        builder
            .Property(u => u.Username)
            .HasMaxLength(16)
            .IsRequired();

        builder
            .Property(u => u.DisplayName)
            .HasMaxLength(64)
            .IsRequired();

        builder
            .Property(u => u.PasswordSalt)
            .HasMaxLength(16)
            .IsRequired();

        builder
            .Property(u => u.PasswordHash)
            .HasMaxLength(64)
            .IsRequired();

        builder
            .Property(u => u.CreatedAt)
            .IsRequired();

        builder
            .HasMany(u => u.Sessions)
            .WithOne(s => s.User)
            .HasForeignKey(s => s.UserId);

        builder
            .HasMany(u => u.Roles)
            .WithMany(r => r.Users);
    }
}