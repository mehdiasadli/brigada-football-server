/**
 * In a single team:
 *
 * Number of assists cannot exceed number of goals
 * Also:
 *
 * Assists of a player cannot exceed number of goals of other players
 *
 *
 */

import { BadRequestException } from '@nestjs/common';

export function validateGoalAssists(
  players: { goals: number; assists: number }[],
) {
  const totalGoals = players.reduce((acc, player) => acc + player.goals, 0);
  const totalAssists = players.reduce((acc, player) => acc + player.assists, 0);

  if (totalAssists > totalGoals) {
    throw new BadRequestException(
      'Number of assists cannot exceed number of goals',
    );
  }

  for (const player of players) {
    if (player.assists > totalGoals - player.goals) {
      throw new BadRequestException(
        'Assists of a player cannot exceed number of goals of other players',
      );
    }
  }

  return true;
}
