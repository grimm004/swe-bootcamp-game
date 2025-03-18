namespace GameServer.Domain.Models;

public sealed record AuthRoleUpdate
{
    public string? Name { get; init; }
    public string? Description { get; init; }
}