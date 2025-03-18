namespace GameServer.Domain.Models;

public sealed record UserUpdate
{
    public string? DisplayName { get; init; }
}