import mitt from 'mitt'

type Events = {
  'updateName': void
  'userLoggedOut': void
}

export default mitt<Events>()
