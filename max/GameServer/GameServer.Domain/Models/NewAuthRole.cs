namespace GameServer.Domain.Models;

public sealed record NewAuthRole
{
    public required string Name { get; init; }
    public required string Description { get; init; }
}