import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { CuriusLink } from "./CuriusLink";

@Entity({ name: "curius_users" })
export class CuriusUser {
    @PrimaryColumn()
    id!: number;

    @Column()
    firstName!: string;

    @Column()
    lastName!: string;

    @Column()
    userLink!: string;

    @Column()
    lastOnline!: Date;

    @ManyToOne(() => CuriusLink, (link) => link.users)
    @JoinColumn({ name: "link_id" })
    link!: Promise<CuriusLink>;
}
