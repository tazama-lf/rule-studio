import Grid from "@mui/material/Grid";
import { useState } from "react";
import Button from "./Button";
import { SecondaryContainer, SectionContainer } from "./Containers";
import type { DropdownOption } from "./DropDown";
import DropDown from "./DropDown";
import Input from "./Input";
import { Text } from "./Text";

const statusOptions: DropdownOption[] = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Pending', value: 'pending' },
];

const Components = () => {

    const [count, setCount] = useState(0)
    const [status, setStatus] = useState<DropdownOption | null>(null);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [bio, setBio] = useState('');



    return (
        <SecondaryContainer>
            <SectionContainer >
                <Text size="subHeader" textAlign={'left'} fontWeight={500} mb={1}>
                    Button Components
                </Text>
                <Grid container size={{ xs: 12, md: 12 }} spacing={2}>
                    <Button size="md" onClick={() => setCount((count) => count + 1)} text={`Count ${count}`} />
                    <Button type="secondary" size="md" onClick={() => setCount((count) => count + 1)} text={`Count ${count}`} />
                    <Button type="danger" size="md" onClick={() => setCount((count) => count + 1)} text={`Count ${count}`} />
                    <Button type="success" size="md" onClick={() => setCount((count) => count + 1)} text={`Count ${count}`} />
                </Grid>
            </SectionContainer>
            <SectionContainer>
                <Text size="subHeader" textAlign={'left'} fontWeight={500} mb={1}>
                    DropDown Components
                </Text>
                <Grid container size={{ xs: 12, md: 12 }} spacing={2}>
                    <DropDown
                        label="Status"
                        placeholder="Select status"
                        options={statusOptions}
                        value={status}
                        required
                        onChange={(val) => setStatus(val as DropdownOption)}
                        multiple={false}
                    />
                    <DropDown
                        label="Status"
                        placeholder="Select status"
                        options={statusOptions}
                        value={status}
                        onChange={(val) => setStatus(val as DropdownOption)}
                        multiple={true}
                    />
                    <DropDown
                        label="Status"
                        placeholder="Select status"
                        searchable
                        options={statusOptions}
                        value={status}
                        onChange={(val) => setStatus(val as DropdownOption)}
                        multiple={true}
                    />
                    <Input
                        label="Full Name"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Input
                        type="password"
                        label="Password"
                        placeholder="Enter your name"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Input
                        label="Bio"
                        type="textarea"
                        rows={5}
                        placeholder="Tell us about yourself"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                    />
                </Grid>
            </SectionContainer>

        </SecondaryContainer>
    )
}

export default Components;
