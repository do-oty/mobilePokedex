import { memo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { colors } from '../theme/colors';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

const SearchBar = ({ value, onChangeText, placeholder = 'Search Pokémon...' }: Props) => {
  return (
    <View style={styles.container}>
      <Icon name="search" size={16} color={colors.textMuted} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blackPanel,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    padding: 0,
    height: 20,
  },
});

export default memo(SearchBar);

