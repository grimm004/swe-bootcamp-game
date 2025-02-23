using GameServer.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameServer.Data.EntityDbMappers;

internal class AuthRoleMapping : IEntityTypeConfiguration<AuthRole>
{
    public void Configure(EntityTypeBuilder<AuthRole> builder)
    {
        builder
            .HasKey(r => r.Name);

        builder
            .Property(r => r.Name)
            .HasMaxLength(32)
            .IsRequired();

        builder
            .Property(r => r.Description)
            .HasMaxLength(128)
            .IsRequired();

        builder
            .HasMany(r => r.Users)
            .WithMany(u => u.Roles);

        builder.HasData(
            new AuthRole { Name = "admin", Description = "Administrator" },
            new AuthRole { Name = "player", Description = "Player role" }
        );
    }
}