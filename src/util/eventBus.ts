import mitt from 'mitt'

type Events = {
  'updateName': void
}

export default mitt<Events>()
