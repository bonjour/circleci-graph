import { Command, flags } from '@oclif/command';
import GraphGenerator from './GraphGenerator';

class CircleciGraph extends Command {
  static description = 'Generate a Dot Dump to copy-paste in a graphviz application';

  static flags = {
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),
    workflows: flags.string({
      char: 'w',
      description: 'name of the workflow to draw',
      multiple: true,
    }),
  };

  static args = [
    { name: 'path', description: 'path to the circle config.yaml file', require: true },
  ];

  async run() {
    const { args, flags } = this.parse(CircleciGraph);
    const generator = new GraphGenerator(args.path, flags.workflows);
    this.log(generator.generate());
  }
}

export = CircleciGraph;
