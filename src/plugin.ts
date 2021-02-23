export interface Plugin {
  enter(): void
  exit(): void
}

export class PluginStack implements Plugin {
  plugins: Plugin[]
  constructor () {
    this.plugins = []
  }

  enter () {
    for (let i = 0; i < this.plugins.length; i++) {
      this.plugins[i]!.enter()
    }
  }

  exit () {
    for (let i = this.plugins.length - 1; i >= 0; i--) {
      this.plugins[i]!.exit()
    }
  }
}
