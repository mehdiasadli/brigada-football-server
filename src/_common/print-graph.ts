import { INestApplication } from '@nestjs/common';
import { SpelunkerModule } from 'nestjs-spelunker';

export const printGraph = (app: INestApplication, disabled = true) => {
  if (disabled) return;

  const tree = SpelunkerModule.explore(app);
  const root = SpelunkerModule.graph(tree);
  const edges = SpelunkerModule.findGraphEdges(root);
  console.log('graph LR');
  const mermaidEdges = edges.map(
    ({ from, to }) => `  ${from.module.name} --> ${to.module.name}`,
  );
  console.log(mermaidEdges.join('\n'));
};
