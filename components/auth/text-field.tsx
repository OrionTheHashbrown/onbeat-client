import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { colours, cornerRadius, fontSizes, spacing } from '../../lib/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  errorText?: string | null;
  isPassword?: boolean;
  inputRef?: React.Ref<TextInput>;
};

export function TextField({ label, errorText, isPassword, inputRef, ...inputProps }: TextFieldProps) {
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);

  function handleShowPasswordButton() {
    setIsPasswordHidden(!isPasswordHidden);
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.inputBox, errorText ? styles.inputBoxError : null]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholderTextColor={colours.textMuted}
          secureTextEntry={isPassword && isPasswordHidden}
          autoCapitalize="none"
          autoCorrect={false}
          {...inputProps}
        />

        {isPassword ? (
          <Pressable onPress={handleShowPasswordButton} hitSlop={12}>
            <SymbolView
              name={isPasswordHidden ? 'eye' : 'eye.slash'}
              tintColor={colours.textSecondary}
              size={20}
            />
          </Pressable>
        ) : null}
      </View>

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    color: colours.textSecondary,
    fontSize: fontSizes.small,
    fontWeight: '600',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colours.surface,
    borderColor: colours.border,
    borderWidth: 1,
    borderRadius: cornerRadius,
    paddingHorizontal: spacing.large,
  },
  inputBoxError: {
    borderColor: colours.danger,
  },
  input: {
    flex: 1,
    color: colours.text,
    fontSize: fontSizes.body,
    paddingVertical: spacing.large - 2,
  },
  errorText: {
    color: colours.danger,
    fontSize: fontSizes.hint,
  },
});
