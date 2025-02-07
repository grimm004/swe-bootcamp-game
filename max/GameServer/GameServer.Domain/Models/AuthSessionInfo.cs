namespace GameServer.Domain.Models;

public record AuthSessionInfo
{
    public Guid Id { get; set; }
    public User User { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
}