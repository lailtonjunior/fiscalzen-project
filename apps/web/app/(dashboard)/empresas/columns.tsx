'use client'

import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, FileEdit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

export type Company = {
    id: string
    razaoSocial: string
    cnpj: string
    status: 'active' | 'inactive'
    createdAt: string
}

export const columns: ColumnDef<Company>[] = [
    {
        accessorKey: 'razaoSocial',
        header: 'Razão Social',
    },
    {
        accessorKey: 'cnpj',
        header: 'CNPJ',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue('status') as string
            return (
                <div className={`capitalize ${status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                    {status === 'active' ? 'Ativo' : 'Inativo'}
                </div>
            )
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const company = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(company.id)}
                        >
                            Copiar ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href={`/empresas/${company.id}`}>
                                <FileEdit className="mr-2 h-4 w-4" />
                                Editar
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
