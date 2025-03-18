using GameServer.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameServer.Data.EntityDbMappers;

internal sealed class AuthSessionMapping : IEntityTypeConfiguration<AuthSession>
{
    public void Configure(EntityTypeBuilder<AuthSession> builder)
    {
        builder
            .HasKey(s => s.Id);

        builder
            .HasOne(s => s.User)
            .WithMany(u => u.Sessions)
            .HasForeignKey(s => s.UserId);

        builder
            .Property(s => s.TokenHash)
            .HasMaxLength(32)
            .IsRequired();

        builder
            .Property(s => s.CreatedAt)
            .IsRequired();

        builder
            .Property(s => s.ExpiresAt)
            .IsRequired();

        builder
            .Property(s => s.RevokedAt);
    }
}