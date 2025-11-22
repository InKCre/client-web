export type InkButtonVariant = 'default' | 'primary' | 'danger' | 'ghost'
export type InkButtonSize = 'sm' | 'md'

export interface InkButtonProps {
  variant?: InkButtonVariant
  size?: InkButtonSize
  block?: boolean
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}
