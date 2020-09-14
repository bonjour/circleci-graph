import * as fs from 'fs';
import * as YAML from 'yaml';

export default class GraphGenerator {
  private readonly config: any;
  private readonly workflows: Array<string>;

  constructor(path: string, workflows: Array<string> = []) {
    const file = fs.readFileSync(path, 'utf8');
    this.config = YAML.parse(file);
    this.workflows =
      workflows.length > 0 ? workflows : Object.getOwnPropertyNames(this.config.workflows);
  }

  public generate() {
    console.log('Dump dot file for this following workflows', this.workflows);

    let dump = '';
    dump += GraphGenerator.startDot();
    for (const workflow of this.workflows) {
      if (this.config.workflows[workflow] === undefined) {
        console.error(`The ${workflow} workflow does not exist!`);
        continue;
      }
      dump += 'subgraph cluster_' + GraphGenerator.toSnakeCase(workflow) + ' {\n';
      dump += 'label="' + workflow + '";\n';
      const nodes = this.findNodes(workflow);
      const edges = this.findEdges(workflow);
      dump += this.addNodes(nodes) + this.addEdges(edges);
      dump += '};\n';
    }
    dump += GraphGenerator.endDot();

    return dump;
  }

  private findNodes(workflow: string) {
    const nodes: Array<any> = [];

    this.config.workflows[workflow].jobs.forEach((job: any) => {
      const jobName = Object.entries(job)[0][0];
      nodes.push({
        name: GraphGenerator.toSnakeCase(workflow) + '_' + GraphGenerator.toSnakeCase(jobName),
        label: jobName,
      });
    });

    return nodes;
  }

  private findEdges(workflow: string) {
    const edges: Array<any> = [];

    this.config.workflows[workflow].jobs.forEach((job: any) => {
      const jobName = Object.entries(job)[0][0];
      const requires = job[jobName].requires;

      if (requires === undefined) return edges;
      requires.forEach((dependency: any) => {
        edges.push({
          from: GraphGenerator.toSnakeCase(workflow) + '_' + GraphGenerator.toSnakeCase(dependency),
          to: GraphGenerator.toSnakeCase(workflow) + '_' + GraphGenerator.toSnakeCase(jobName),
        });
      });
    });

    return edges;
  }

  private static startDot(): string {
    return 'digraph sc {\n ratio="compress" rankdir="LR";\n node [fontsize="11" fontname="Arial" shape="record"];\n\n';
  }

  private addNodes(nodes: Array<any>): string {
    let result = '';
    nodes.forEach((node) => {
      result += ' ' + node.name + ' [label="' + node.label + '"];\n';
    });

    return result;
  }

  private addEdges(edges: Array<any>): string {
    let result = '';

    edges.forEach((edge) => {
      result += ' ' + edge.from + ' -> ' + edge.to + ';\n';
    });

    return result;
  }

  private static endDot(): string {
    return '}\n';
  }

  private static toSnakeCase(str: string): string {
    const regExpMatchArray: '' | RegExpMatchArray | null =
      str && str.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g);
    if (regExpMatchArray === null) return '';
    if (regExpMatchArray === '') return '';
    return regExpMatchArray.map((x) => x.toLowerCase()).join('_');
  }
}
