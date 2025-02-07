namespace GameServer.Domain.Models;

public record AuthSession
{
    public Guid Id { get; set; }
    public User User { get; set; } = null!;
    public string Token { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
}