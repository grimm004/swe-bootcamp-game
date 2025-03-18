using GameServer.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GameServer.Data.EntityDbMappers;

internal sealed class LobbyMapping : IEntityTypeConfiguration<Lobby>
{
    public void Configure(EntityTypeBuilder<Lobby> builder)
    {
        builder
            .HasKey(l => l.Id);

        builder
            .HasIndex(l => l.JoinCode)
            .IsUnique();

        builder
            .Property(l => l.JoinCode)
            .HasMaxLength(8)
            .IsRequired();

        builder
            .Property(l => l.Status)
            .IsRequired();

        builder
            .HasOne(l => l.Host);

        builder
            .HasMany(l => l.Users)
            .WithOne(u => u.Lobby)
            .HasForeignKey(u => u.LobbyId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}