import React, { useState } from 'react'
import {
  Dialog,
  TextField,
  Button,
  DialogTitle,
  FormControl,
  Select,
  MenuItem,
  FormHelperText
} from '@material-ui/core'
import { connect } from 'react-redux'
import { TState } from '../../../types/state'
import { id, getAllListsArr } from '../../../utils/utilities'
import { GQL_EDIT_TASK } from '../../../graphql/mutations/task'
import { useMutation } from '@apollo/react-hooks'
import {
  EditTaskMutation,
  EditTaskMutationVariables,
  EditListMutation,
  EditListMutationVariables
} from '../../../graphql/types'
import { setTaskA } from '../../../store/actions/task'
import { ChooseColor } from '../../utils/chooseColor'
import { GQL_EDIT_LIST } from '../../../graphql/mutations/list'
import { setListA } from '../../../store/actions/list'

const mapState = (state: TState, ownProps: OwnProps) => {
  const project = state.projects[id(state.projects, ownProps.projectId)]

  return {
    task: project.tasks[id(project.tasks, ownProps.taskId)],
    projects: state.projects
  }
}

const actionCreators = {
  setTask: setTaskA,
  setList: setListA
}

type OwnProps = {
  onClose: () => void
  taskId: string
  projectId: string
}

type TProps = OwnProps & ReturnType<typeof mapState> & typeof actionCreators

export const EditTaskModal = connect(
  mapState,
  actionCreators
)((props: TProps) => {
  // apply changes locally (not in store) immediately, then when submit do on store and server
  const [task, setTask] = useState(props.task)

  const [editTaskExec] = useMutation<
    EditTaskMutation,
    EditTaskMutationVariables
  >(GQL_EDIT_TASK, {
    variables: {
      taskId: props.taskId,
      newTask: {
        name: task.name,
        points: task.points,
        dueDate: task.dueDate,
        // recurrance: task.recurrance,
        color: task.color
      },
      projId: props.projectId
    }
  })
  const [editListExec] = useMutation<
    EditListMutation,
    EditListMutationVariables
  >(GQL_EDIT_LIST, {
    onCompleted: ({ editList }) => {
      props.setList({
        id: editList.list!.id,
        projectId: editList.project.id,
        newList: { taskIds: editList.list!.taskIds }
      })
    }
  })

  const project = props.projects[id(props.projects, props.projectId)]

  const ownerListId = project.lists.find(list =>
    list.taskIds.includes(task.id)
  )!.id

  const [listId, setListId] = useState(ownerListId)

  return (
    <div>
      <Dialog open onClose={() => props.onClose()}>
        <form
          onSubmit={e => {
            props.setTask({
              id: props.task.id,
              projectId: props.projectId,
              newTask: task
            })
            editTaskExec()
            if (listId !== ownerListId) {
              // change from old to new listId
              editListExec({
                variables: {
                  projectId: props.projectId,
                  id: ownerListId,
                  newList: {
                    taskIds: project.lists[
                      id(project.lists, ownerListId)
                    ].taskIds.filter(tId => tId !== task.id)
                  }
                }
              })
              editListExec({
                variables: {
                  projectId: props.projectId,
                  id: listId,
                  newList: {
                    taskIds: [
                      task.id,
                      ...project.lists[id(project.lists, listId)].taskIds
                    ]
                  }
                }
              })
            }
            e.preventDefault()
            props.onClose()
          }}
          style={{ minWidth: 550, padding: '0px 16px', paddingBottom: 12 }}
        >
          <DialogTitle style={{ paddingLeft: '0px' }}>Edit Task</DialogTitle>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              flex: '0 0 auto'
            }}
          >
            <TextField
              style={{ margin: '0 4px' }}
              required
              autoFocus
              variant="outlined"
              color="secondary"
              label="Title"
              value={task.name}
              onChange={({ target }) =>
                setTask({ ...task, name: target.value })
              }
              fullWidth
            />
            <TextField
              style={{ margin: '0 4px', width: '33%' }}
              required
              fullWidth
              variant="outlined"
              label="Points"
              value={task.points}
              type="number"
              onChange={e => {
                e.persist() // for some reason it unfocuses without this!
                if (parseInt(e.target.value) >= 0) {
                  setTask({ ...task, points: parseInt(e.target.value) })
                }
              }}
            />
          </div>
          <div style={{ display: 'flex', marginTop: 8 }}>
            <ChooseColor
              color={task.color || '#FFFFFF'}
              onChange={(color: string) => {
                setTask({ ...task, color })
              }}
            />

            <div style={{ width: 24 }} />

            <FormControl fullWidth>
              <Select
                fullWidth
                value={listId}
                onChange={e => {
                  setListId(e.target.value as any)
                }}
              >
                {getAllListsArr(props.projects).map((list, i) => {
                  return (
                    <MenuItem key={list.id} value={list.id}>
                      <pre>
                        <em>{list.name}</em> of{' '}
                        {
                          props.projects[id(props.projects, props.projectId)]
                            .name
                        }
                      </pre>
                    </MenuItem>
                  )
                })}
              </Select>
              <FormHelperText>Task's List</FormHelperText>
            </FormControl>
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 8,
              justifyContent: 'flex-end'
            }}
          >
            <Button color="secondary" type="submit" variant="contained">
              Save
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
})
