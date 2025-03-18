using System.Text;
using GameServer.Data.Entities;
using GameServer.Domain.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameServer.Data.EntityDbMappers;

internal sealed class UserMapping(ISaltedHashService saltedHashService) : IEntityTypeConfiguration<User>
{
    private const string DefaultAdminPassword = "admin";

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
            .Property(u => u.CreatedAt)
            .IsRequired();

        builder.OwnsOne(u => u.AuthCredentials, od =>
        {
            od.ToTable(nameof(UserAuthCredentials));

            od.Property(ac => ac.PasswordSalt)
                .HasMaxLength(8)
                .IsRequired();

            od.Property(ac => ac.PasswordHash)
                .HasMaxLength(64)
                .IsRequired();
        });

        builder
            .HasMany(u => u.Sessions)
            .WithOne(s => s.User)
            .HasForeignKey(s => s.UserId);

        builder
            .HasMany(u => u.Roles)
            .WithMany(r => r.Users)
            .UsingEntity($"{nameof(User)}{nameof(AuthRole)}",
                ur => ur
                    .HasOne(typeof(User))
                    .WithMany()
                    .HasForeignKey($"{nameof(User)}{nameof(User.Id)}")
                    .HasPrincipalKey(nameof(User.Id)),
                ur => ur
                    .HasOne(typeof(AuthRole))
                    .WithMany()
                    .HasForeignKey($"{nameof(AuthRole)}{nameof(AuthRole.Name)}")
                    .HasPrincipalKey(nameof(AuthRole.Name))
            );

        var adminUserId = new Guid("00000000-0000-0000-0000-000000000001");

        builder
            .HasData(
                new User
                {
                    Id = adminUserId,
                    Username = "admin",
                    DisplayName = "Admin",
                    CreatedAt = DateTime.UtcNow
                }
            );

        var passwordData = Encoding.UTF8.GetBytes(DefaultAdminPassword);
        var passwordSalt = saltedHashService.GenerateRandomBytes(8);
        var passwordHash = saltedHashService.HashData(passwordData, passwordSalt);

        builder.OwnsOne(u => u.AuthCredentials).HasData(
            new
            {
                UserId = adminUserId,
                PasswordSalt = passwordSalt,
                PasswordHash = passwordHash
            }
        );

        builder
            .HasMany(u => u.Roles)
            .WithMany(r => r.Users)
            .UsingEntity($"{nameof(User)}{nameof(AuthRole)}")
            .HasData(
                new { UserId = adminUserId, AuthRoleName = "player" },
                new { UserId = adminUserId, AuthRoleName = "admin" });
    }
}