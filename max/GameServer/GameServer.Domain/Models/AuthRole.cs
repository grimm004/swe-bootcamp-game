namespace GameServer.Domain.Models;

public sealed record AuthRole
{
    public required string Name { get; init; }
    public required string Description { get; init; }
}