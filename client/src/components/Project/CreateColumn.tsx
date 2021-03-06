import * as React from 'react'
import { connect } from 'react-redux'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  TextField,
  DialogActions,
  Button,
  Theme,
  createStyles,
  WithStyles,
  IconButton,
  withStyles
} from '@material-ui/core'
import { Close } from '@material-ui/icons'
import { Change } from '../../types/types'
import { setListA } from '../../store/actions/list'
import { TProject } from '../../types/project'
import { useState } from 'react'
import {
  CreateListMutation,
  CreateListMutationVariables
} from '../../graphql/types'
import { GQL_CREATE_LIST } from '../../graphql/mutations/list'
import { useMutation } from 'react-apollo'

interface OwnProps {
  project: TProject
  onClose(): void
}

type CreateColumnProps = typeof actionCreators &
  OwnProps &
  WithStyles<typeof styles>

const styles = (theme: Theme) =>
  createStyles({
    closeButton: {
      position: 'absolute',
      right: theme.spacing(1),
      top: theme.spacing(1),
      color: theme.palette.grey[500]
    }
  })

const CCreateColumn = (props: CreateColumnProps) => {
  const { project, onClose, classes } = props

  const [name, setName] = useState('')

  const [createListExec] = useMutation<
    CreateListMutation,
    CreateListMutationVariables
  >(GQL_CREATE_LIST, {
    onCompleted: ({ createList }) => {
      props.setList({
        id: createList.list!.id,
        projectId: props.project.id,
        newList: {
          taskIds: [],
          name: createList.list!.name || 'List'
        }
      })
    }
  })

  return (
    <Dialog open={true} onClose={onClose}>
      <form
        onSubmit={e => {
          e.preventDefault()

          createListExec({
            variables: {
              name: name || 'List',
              projId: project.id
            }
          })
    
          onClose()
        }}
      >
        <DialogTitle>Create List</DialogTitle>
        <IconButton className={classes.closeButton} onClick={onClose}>
          <Close />
        </IconButton>
        <DialogContent>
          <DialogContentText>
            Lists should contain either a type or date of task. Ex: "Amanda",
            "Expert Tasks", or "Writing"
          </DialogContentText>
          <TextField
            required
            autoFocus
            margin="dense"
            label="List Name"
            value={name}
            onChange={({ target }: Change) => setName(target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button  onClick={onClose} color="secondary">
            Cancel
          </Button>
          <Button  variant="contained" color="primary" type="submit">
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

const actionCreators = {
  setList: setListA
}
// rename
export const CreateColumn = connect(
  null,
  actionCreators
)(withStyles(styles)(CCreateColumn))
