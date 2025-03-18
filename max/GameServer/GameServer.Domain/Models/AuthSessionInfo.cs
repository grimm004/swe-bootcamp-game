namespace GameServer.Domain.Models;

public sealed record AuthSessionInfo
{
    public Guid Id { get; init; }
    public User User { get; init; } = null!;
    public DateTime CreatedAt { get; init; }
    public DateTime ExpiresAt { get; init; }
    public DateTime? RevokedAt { get; init; }
}